#!/usr/bin/env node
"use strict";

const net = require("net");
const path = require("path");
const os = require("os");
const fs = require("fs");

const SOCKET_DIR = path.join(os.homedir(), ".shellfire");

// Find the most recent active socket (supports multi-instance)
function findSocketPath() {
  if (!fs.existsSync(SOCKET_DIR)) return null;
  const socks = fs.readdirSync(SOCKET_DIR)
    .filter(f => f.startsWith("shellfire-") && f.endsWith(".sock"))
    .map(f => ({ name: f, path: path.join(SOCKET_DIR, f), mtime: fs.statSync(path.join(SOCKET_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  // Also check legacy path
  const legacy = path.join(SOCKET_DIR, "shellfire.sock");
  if (fs.existsSync(legacy)) socks.push({ name: "shellfire.sock", path: legacy, mtime: 0 });
  return socks.length > 0 ? socks[0].path : null;
}
const SOCKET_PATH = findSocketPath();

const usage = `
  shellfire - Terminal multiplexer CLI

  Usage:
    shellfire list                       List all terminal sessions
    shellfire attach -t <name>           Attach/focus a session by name
    shellfire new [-t <name>] [-d <dir>] Create a new terminal session
    shellfire send -t <name> <text>      Send input to a named session
    shellfire kill -t <name>             Kill a terminal session by name
    shellfire rename -t <old> <new>      Rename a terminal session
    shellfire remote <user@host> [-p port] [-w password]
                                          Discover & open remote sessions

  Options:
    -t, --target <name>   Target session name
    -d, --dir <path>      Working directory for new terminal
    -p, --port <port>     SSH port (default: 22)
    -w, --password <pwd>  SSH password (WARNING: visible in process list via ps aux;
                            prefer SHELLFIRE_SSH_PASSWORD env var instead)
    -h, --help            Show this help
    -v, --version         Show version

  Environment:
    SHELLFIRE_SSH_PASSWORD   SSH password (recommended over -w flag for security)

  Examples:
    shellfire list
    shellfire new -t backend -d ~/projects/api
    shellfire attach -t backend
    shellfire send -t backend "npm start"
    shellfire rename -t backend "API Server"
    shellfire kill -t backend
    shellfire remote user@192.168.1.100 -w mypassword
    shellfire remote deploy@prod-server -p 2222
`.trim();

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    return { command: "help" };
  }
  if (args[0] === "-v" || args[0] === "--version") {
    return { command: "version" };
  }

  const command = args[0];
  let target = null;
  let dir = null;
  let port = null;
  let password = null;
  const rest = [];

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === "-t" || args[i] === "--target") && i + 1 < args.length) {
      target = args[++i];
    } else if ((args[i] === "-d" || args[i] === "--dir") && i + 1 < args.length) {
      dir = args[++i];
    } else if ((args[i] === "-p" || args[i] === "--port") && i + 1 < args.length) {
      port = parseInt(args[++i]);
    } else if ((args[i] === "-w" || args[i] === "--password") && i + 1 < args.length) {
      password = args[++i];
    } else {
      rest.push(args[i]);
    }
  }

  return { command, target, dir, port, password, rest };
}

function sendCommand(cmd) {
  return new Promise((resolve, reject) => {
    if (!SOCKET_PATH || !fs.existsSync(SOCKET_PATH)) {
      reject(new Error("Shellfire is not running. Start the app first."));
      return;
    }

    const client = net.createConnection(SOCKET_PATH, () => {
      client.write(JSON.stringify(cmd) + "\n");
    });

    let data = "";
    client.on("data", (chunk) => {
      data += chunk.toString();
    });

    client.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid response from Shellfire"));
      }
    });

    client.on("error", (err) => {
      if (err.code === "ECONNREFUSED" || err.code === "ENOENT") {
        reject(new Error("Shellfire is not running. Start the app first."));
      } else {
        reject(err);
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      client.destroy();
      reject(new Error("Connection timed out"));
    }, 5000);
  });
}

function formatTable(sessions) {
  if (sessions.length === 0) {
    return "  No active sessions";
  }

  const nameWidth = Math.max(6, ...sessions.map((s) => (s.name || "").length));
  const idWidth = Math.max(2, ...sessions.map((s) => String(s.id).length));
  const cwdWidth = Math.max(3, ...sessions.map((s) => (s.cwd || "").length));

  const header = `  ${"ID".padEnd(idWidth)}  ${"NAME".padEnd(nameWidth)}  ${"CWD".padEnd(cwdWidth)}  PROCESS`;
  const sep = `  ${"─".repeat(idWidth)}  ${"─".repeat(nameWidth)}  ${"─".repeat(cwdWidth)}  ${"─".repeat(12)}`;

  const rows = sessions.map((s) => {
    const id = String(s.id).padEnd(idWidth);
    const name = (s.name || `Terminal ${s.id}`).padEnd(nameWidth);
    const cwd = (s.cwd || "").padEnd(cwdWidth);
    const proc = s.process || "-";
    const active = s.active ? " *" : "";
    return `  ${id}  ${name}  ${cwd}  ${proc}${active}`;
  });

  return [header, sep, ...rows].join("\n");
}

function attachSession(target) {
  return new Promise((resolve, reject) => {
    if (!SOCKET_PATH || !fs.existsSync(SOCKET_PATH)) {
      reject(new Error("Shellfire is not running. Start the app first."));
      return;
    }

    const client = net.createConnection(SOCKET_PATH, () => {
      // Request streaming attach
      client.write(JSON.stringify({ action: "attach", name: target, stream: true }) + "\n");
    });

    let handshakeDone = false;
    let buffer = "";

    client.on("data", (chunk) => {
      if (!handshakeDone) {
        // First line is the JSON handshake response
        buffer += chunk.toString();
        const newlineIdx = buffer.indexOf("\n");
        if (newlineIdx === -1) return;

        const line = buffer.slice(0, newlineIdx);
        const rest = buffer.slice(newlineIdx + 1);
        buffer = "";
        handshakeDone = true;

        let resp;
        try { resp = JSON.parse(line); } catch {
          console.error("Invalid handshake response");
          client.destroy();
          process.exit(1);
          return;
        }

        if (resp.error) {
          console.error(`Error: ${resp.error}`);
          client.destroy();
          process.exit(1);
          return;
        }

        // Handshake OK — switch to raw terminal mode
        console.log(`\x1b[2mAttached to "${resp.name}" (id: ${resp.id}) — Ctrl+\\ to detach\x1b[0m`);

        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        // Send terminal size
        sendResize();
        process.stdout.on("resize", sendResize);

        function sendResize() {
          const cols = process.stdout.columns || 80;
          const rows = process.stdout.rows || 24;
          // Resize control message: null byte prefix + JSON
          client.write("\x00" + JSON.stringify({ cols, rows }) + "\n");
        }

        // Pipe stdin to the socket (which goes to the pty)
        process.stdin.on("data", (data) => {
          // Ctrl+\ (0x1c) = detach
          if (data.length === 1 && data[0] === 0x1c) {
            detach();
            return;
          }
          client.write(data);
        });

        function detach() {
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
          process.stdout.removeListener("resize", sendResize);
          client.end();
          console.log(`\n\x1b[2mDetached from "${resp.name}"\x1b[0m`);
          resolve();
        }

        // If there was data after the handshake newline, write it to stdout
        if (rest.length > 0) {
          process.stdout.write(rest);
        }
        return;
      }

      // After handshake: raw pty output → stdout
      process.stdout.write(chunk);
    });

    client.on("end", () => {
      if (process.stdin.isTTY && process.stdin.isRaw) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      if (handshakeDone) {
        console.log("\n\x1b[2mSession ended\x1b[0m");
      }
      resolve();
    });

    client.on("error", (err) => {
      if (process.stdin.isTTY && process.stdin.isRaw) {
        process.stdin.setRawMode(false);
      }
      if (err.code === "ECONNREFUSED" || err.code === "ENOENT") {
        reject(new Error("Shellfire is not running. Start the app first."));
      } else {
        reject(err);
      }
    });

    // Timeout only for the handshake
    const handshakeTimeout = setTimeout(() => {
      if (!handshakeDone) {
        client.destroy();
        reject(new Error("Attach handshake timed out"));
      }
    }, 5000);

    client.once("data", () => clearTimeout(handshakeTimeout));
  });
}

async function main() {
  const { command, target, dir, port, password, rest } = parseArgs(process.argv);

  try {
    switch (command) {
      case "help":
        console.log(usage);
        break;

      case "version": {
        let version = "unknown";
        try {
          const pkg = JSON.parse(
            fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
          );
          version = pkg.version;
        } catch {}
        console.log(`shellfire v${version}`);
        break;
      }

      case "list":
      case "ls": {
        const result = await sendCommand({ action: "list" });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log("\n  Shellfire Sessions\n");
        console.log(formatTable(result.sessions));
        console.log(`\n  ${result.sessions.length} session(s) (* = active)\n`);
        break;
      }

      case "attach": {
        if (!target) {
          console.error("Error: -t <name> is required for attach");
          process.exit(1);
        }
        await attachSession(target);
        break;
      }

      case "new": {
        const result = await sendCommand({
          action: "new",
          name: target || null,
          cwd: dir || null,
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(
          `Created session "${result.name}" (id: ${result.id})${dir ? ` in ${dir}` : ""}`
        );
        break;
      }

      case "send": {
        if (!target) {
          console.error("Error: -t <name> is required for send");
          process.exit(1);
        }
        const text = rest.join(" ");
        if (!text) {
          console.error("Error: no text to send");
          process.exit(1);
        }
        const result = await sendCommand({
          action: "send",
          name: target,
          text,
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(`Sent to "${result.name}": ${text}`);
        break;
      }

      case "kill": {
        if (!target) {
          console.error("Error: -t <name> is required for kill");
          process.exit(1);
        }
        const result = await sendCommand({ action: "kill", name: target });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(`Killed session "${result.name}" (id: ${result.id})`);
        break;
      }

      case "rename": {
        if (!target) {
          console.error("Error: -t <old-name> is required for rename");
          process.exit(1);
        }
        const newName = rest[0];
        if (!newName) {
          console.error("Error: new name is required");
          process.exit(1);
        }
        const result = await sendCommand({
          action: "rename",
          name: target,
          newName,
        });
        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        console.log(`Renamed "${target}" -> "${result.name}"`);
        break;
      }

      case "remote": {
        const hostArg = rest[0];
        if (!hostArg) {
          console.error("Error: remote requires user@host argument");
          console.error("  Usage: shellfire remote <user@host> [-p port] [-w password]");
          process.exit(1);
        }

        // Parse user@host
        let user, host;
        if (hostArg.includes("@")) {
          [user, host] = hostArg.split("@", 2);
        } else {
          host = hostArg;
          user = process.env.USER || process.env.USERNAME || "root";
        }

        const sshPort = port || 22;
        const sshPassword = password || process.env.SHELLFIRE_SSH_PASSWORD || "";

        console.log(`\n  Discovering Shellfire sessions on ${user}@${host}${sshPort !== 22 ? ':' + sshPort : ''}...\n`);

        // Create a temporary SSH_ASKPASS script for password auth
        const { execFile } = require("child_process");
        const tmpAskpass = path.join(os.tmpdir(), `shellfire-askpass-${Date.now()}.sh`);
        let sshEnv = { ...process.env };

        if (sshPassword) {
          const escaped = sshPassword.replace(/'/g, "'\\''");
          fs.writeFileSync(tmpAskpass, `#!/bin/sh\necho '${escaped}'\n`, { mode: 0o700 });
          sshEnv.SSH_ASKPASS = tmpAskpass;
          sshEnv.SSH_ASKPASS_REQUIRE = "force";
          sshEnv.DISPLAY = "shellfire:0";
        }

        const sshArgs = [
          "-o", "ConnectTimeout=10",
          "-o", "StrictHostKeyChecking=accept-new",
        ];
        if (sshPassword) {
          sshArgs.push("-o", "PreferredAuthentications=password,keyboard-interactive");
          sshArgs.push("-o", "PubkeyAuthentication=no");
        }
        if (sshPort !== 22) sshArgs.push("-p", String(sshPort));
        sshArgs.push(`${user}@${host}`);

        const probe = `node -e '
          const net=require("net"),path=require("path"),os=require("os"),fs=require("fs");
          const DIR=path.join(os.homedir(),".shellfire");
          let SOCK=null;
          try{const ss=fs.readdirSync(DIR).filter(f=>f.startsWith("shellfire-")&&f.endsWith(".sock")).map(f=>({p:path.join(DIR,f),m:fs.statSync(path.join(DIR,f)).mtimeMs})).sort((a,b)=>b.m-a.m);if(ss.length)SOCK=ss[0].p;}catch{}
          if(!SOCK){const leg=path.join(DIR,"shellfire.sock");if(fs.existsSync(leg))SOCK=leg;}
          if(!SOCK){console.log(JSON.stringify({error:"Shellfire is not running on this host"}));process.exit(0)}
          const c=net.createConnection(SOCK,()=>{c.write(JSON.stringify({action:"list"})+"\\n")});
          let d="";c.on("data",ch=>d+=ch.toString());c.on("end",()=>console.log(d));
          c.on("error",e=>{console.log(JSON.stringify({error:e.message}))});
          setTimeout(()=>{console.log(JSON.stringify({error:"timeout"}));process.exit(1)},8000);
        '`;
        sshArgs.push(probe);

        let remoteResult;
        try {
          remoteResult = await new Promise((resolve, reject) => {
            execFile("ssh", sshArgs, { encoding: "utf8", timeout: 20000, env: sshEnv }, (err, stdout, stderr) => {
              // Cleanup askpass script
              try { fs.unlinkSync(tmpAskpass); } catch {}
              if (err) {
                const msg = stderr || err.message;
                if (msg.includes("Permission denied")) reject(new Error("Authentication failed. Check username and password."));
                else if (msg.includes("Connection refused")) reject(new Error("Connection refused"));
                else if (msg.includes("node: command not found") || msg.includes("node: not found")) reject(new Error("Node.js not installed on remote"));
                else reject(new Error(msg.trim() || "SSH failed"));
                return;
              }
              try { resolve(JSON.parse(stdout.trim())); }
              catch { reject(new Error("Invalid response from remote")); }
            });
          });
        } catch (err) {
          try { fs.unlinkSync(tmpAskpass); } catch {}
          throw err;
        }

        if (remoteResult.error) {
          console.error(`  Error: ${remoteResult.error}`);
          process.exit(1);
        }

        const sessions = remoteResult.sessions || [];
        if (sessions.length === 0) {
          console.log("  No active Shellfire sessions on remote host.\n");
          break;
        }

        console.log(`  Found ${sessions.length} session(s):\n`);
        console.log(formatTable(sessions));
        console.log();

        // Open each remote session as a local terminal via the local Shellfire socket
        console.log("  Opening sessions locally...\n");
        const portFlag = sshPort !== 22 ? `-p ${sshPort} ` : "";
        for (const s of sessions) {
          const cwd = s.cwd ? s.cwd.replace(/^~/, "$HOME") : "";
          let sshCmd = `ssh -t ${portFlag}${user}@${host}`;
          if (cwd) {
            sshCmd += ` "cd ${cwd} && exec \\$SHELL -l"`;
          }

          const newResult = await sendCommand({
            action: "new",
            name: `${user}@${host}: ${s.name}`,
          });
          if (newResult.error) {
            console.error(`  Failed to create terminal for "${s.name}": ${newResult.error}`);
            continue;
          }
          // Send the SSH command to the new terminal
          await sendCommand({
            action: "send",
            name: newResult.name,
            text: sshCmd,
          });
          console.log(`  Opened "${newResult.name}" (id: ${newResult.id})`);
        }
        console.log(`\n  Done! ${sessions.length} remote session(s) opened.\n`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}\n`);
        console.log(usage);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
