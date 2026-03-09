const { app, BrowserWindow, ipcMain, Notification, shell } = require("electron");
const pty = require("node-pty");
const path = require("path");
const os = require("os");
const fs = require("fs");

let mainWindow;
const ptys = new Map();
let nextId = 1;

const SESSION_PATH = path.join(app.getPath("userData"), "session.json");
const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");
const SNIPPETS_PATH = path.join(app.getPath("userData"), "snippets.json");
const PROFILES_PATH = path.join(app.getPath("userData"), "profiles.json");
const RECENTS_PATH = path.join(app.getPath("userData"), "recents.json");

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#1e1e1e",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 13, y: 13 },
    vibrancy: "titlebar",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.setFullScreen(true);

  mainWindow.on("closed", () => {
    for (const [, p] of ptys) p.kill();
    ptys.clear();
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

// Create terminal with optional cwd
ipcMain.handle("create-terminal", (_, cwd) => {
  const shellPath = process.env.SHELL || "/bin/zsh";
  const id = nextId++;
  const p = pty.spawn(shellPath, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: cwd || os.homedir(),
    env: { ...process.env, TERM: "xterm-256color", CLAUDECODE: "" },
  });

  ptys.set(id, p);

  p.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("terminal-data", id, data);
    }
  });

  p.onExit(({ exitCode }) => {
    ptys.delete(id);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("terminal-exit", id, exitCode);
    }
  });

  return id;
});

ipcMain.on("terminal-input", (_, id, data) => {
  const p = ptys.get(id);
  if (p) p.write(data);
});

ipcMain.on("terminal-resize", (_, id, cols, rows) => {
  const p = ptys.get(id);
  if (p) p.resize(cols, rows);
});

ipcMain.on("terminal-kill", (_, id) => {
  const p = ptys.get(id);
  if (p) { p.kill(); ptys.delete(id); }
});

ipcMain.on("terminal-broadcast", (_, ids, data) => {
  for (const id of ids) {
    const p = ptys.get(id);
    if (p) p.write(data);
  }
});

// Get cwd for a terminal
ipcMain.handle("get-terminal-cwd", async (_, id) => {
  const p = ptys.get(id);
  if (!p) return null;
  try {
    const { execSync } = require("child_process");
    const pid = p.pid;
    const result = execSync(
      `lsof -p ${pid} -Fn 2>/dev/null | grep '^n/' | grep cwd || lsof -d cwd -p ${pid} -Fn 2>/dev/null | grep '^n/'`,
      { encoding: "utf8", timeout: 2000 }
    ).trim();
    for (const line of result.split("\n")) {
      if (line.startsWith("n/")) return line.slice(1);
    }
    return null;
  } catch { return null; }
});

// Get process name for a terminal
ipcMain.handle("get-terminal-process", async (_, id) => {
  const p = ptys.get(id);
  if (!p) return null;
  try {
    const { execSync } = require("child_process");
    // Get child processes of the pty shell
    const result = execSync(
      `ps -o comm= -p $(pgrep -P ${p.pid} 2>/dev/null | head -1) 2>/dev/null || ps -o comm= -p ${p.pid} 2>/dev/null`,
      { encoding: "utf8", timeout: 2000 }
    ).trim();
    return result.split("/").pop() || null;
  } catch { return null; }
});

// Get git branch for a directory
ipcMain.handle("get-git-branch", async (_, dirPath) => {
  if (!dirPath) return null;
  try {
    const { execSync } = require("child_process");
    const branch = execSync(`git -C "${dirPath}" rev-parse --abbrev-ref HEAD 2>/dev/null`, {
      encoding: "utf8", timeout: 2000
    }).trim();
    return branch || null;
  } catch { return null; }
});

// Get git status (dirty/clean) for a directory
ipcMain.handle("get-git-status", async (_, dirPath) => {
  if (!dirPath) return null;
  try {
    const { execSync } = require("child_process");
    const status = execSync(`git -C "${dirPath}" status --porcelain 2>/dev/null | head -1`, {
      encoding: "utf8", timeout: 2000
    }).trim();
    return status ? "dirty" : "clean";
  } catch { return null; }
});

// Notifications
ipcMain.on("show-notification", (_, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Open file in default editor
ipcMain.on("open-in-editor", (_, filePath) => {
  try {
    const { execSync } = require("child_process");
    // Try VS Code first, then fall back to open
    try {
      execSync(`code "${filePath}"`, { timeout: 3000 });
    } catch {
      shell.openPath(filePath);
    }
  } catch {}
});

// Session
ipcMain.on("save-session", (_, data) => writeJSON(SESSION_PATH, data));
ipcMain.handle("load-session", () => readJSON(SESSION_PATH, null));

// Config
ipcMain.on("save-config", (_, config) => writeJSON(CONFIG_PATH, config));
ipcMain.handle("load-config", () => readJSON(CONFIG_PATH, { theme: 0, fontSize: 13 }));

// Snippets
ipcMain.on("save-snippets", (_, data) => writeJSON(SNIPPETS_PATH, data));
ipcMain.handle("load-snippets", () => readJSON(SNIPPETS_PATH, []));

// Profiles
ipcMain.on("save-profiles", (_, data) => writeJSON(PROFILES_PATH, data));
ipcMain.handle("load-profiles", () => readJSON(PROFILES_PATH, []));

// Recent directories
ipcMain.on("save-recents", (_, data) => writeJSON(RECENTS_PATH, data));
ipcMain.handle("load-recents", () => readJSON(RECENTS_PATH, []));

// Cron management
ipcMain.handle("cron-list", async () => {
  try {
    const { execSync } = require("child_process");
    const raw = execSync("crontab -l 2>/dev/null || true", { encoding: "utf8" });
    return raw.trim().split("\n").filter(l => l && !l.startsWith("#")).map((line, i) => ({ id: i, line, enabled: true }));
  } catch { return []; }
});

ipcMain.handle("cron-add", async (_, cronLine) => {
  try {
    const { execSync } = require("child_process");
    const existing = execSync("crontab -l 2>/dev/null || true", { encoding: "utf8" }).trim();
    const newCron = existing ? existing + "\n" + cronLine : cronLine;
    execSync(`echo "${newCron.replace(/"/g, '\\"')}" | crontab -`, { encoding: "utf8" });
    return true;
  } catch { return false; }
});

ipcMain.handle("cron-remove", async (_, index) => {
  try {
    const { execSync } = require("child_process");
    const lines = execSync("crontab -l 2>/dev/null || true", { encoding: "utf8" }).trim().split("\n");
    const active = lines.filter(l => l && !l.startsWith("#"));
    active.splice(index, 1);
    const comments = lines.filter(l => l.startsWith("#"));
    const newCron = [...comments, ...active].join("\n");
    if (newCron.trim()) {
      execSync(`echo "${newCron.replace(/"/g, '\\"')}" | crontab -`, { encoding: "utf8" });
    } else {
      execSync("crontab -r 2>/dev/null || true", { encoding: "utf8" });
    }
    return true;
  } catch { return false; }
});

// Fuzzy file finder
ipcMain.handle("find-files", async (_, query, dirs) => {
  try {
    const { execSync } = require("child_process");
    const searchDirs = dirs.map(d => `"${d}"`).join(" ");
    const result = execSync(
      `find ${searchDirs} -maxdepth 5 -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' 2>/dev/null | head -5000`,
      { encoding: "utf8", timeout: 5000 }
    ).trim();
    if (!result) return [];
    const files = result.split("\n");
    const q = query.toLowerCase();
    return files
      .filter(f => f.toLowerCase().includes(q))
      .slice(0, 50)
      .map(f => ({ path: f, name: f.split("/").pop(), dir: f.replace(/\/[^/]+$/, "").replace(new RegExp("^" + os.homedir()), "~") }));
  } catch { return []; }
});

// Save pane output to file
ipcMain.handle("save-output", async (_, content, suggestedName) => {
  const { dialog } = require("electron");
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(os.homedir(), "Desktop", suggestedName || "terminal-output.txt"),
    filters: [{ name: "Text", extensions: ["txt", "log"] }],
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content);
    return result.filePath;
  }
  return null;
});

// System monitor
ipcMain.handle("system-stats", async () => {
  try {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((a, c) => a + c.times.idle, 0);
    const totalTick = cpus.reduce((a, c) => a + c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq, 0);
    const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const memGB = ((totalMem - freeMem) / 1073741824).toFixed(1);
    const totalGB = (totalMem / 1073741824).toFixed(1);
    // Disk usage
    let diskUsage = null;
    try {
      const { execSync } = require("child_process");
      const df = execSync("df -h / | tail -1", { encoding: "utf8", timeout: 2000 }).trim().split(/\s+/);
      diskUsage = { used: df[2], total: df[1], percent: parseInt(df[4]) };
    } catch {}
    return { cpuUsage, memUsage, memGB, totalGB, diskUsage, uptime: Math.round(os.uptime() / 60) };
  } catch { return null; }
});

// SSH bookmarks
const SSH_PATH = path.join(app.getPath("userData"), "ssh-bookmarks.json");
ipcMain.on("save-ssh", (_, data) => writeJSON(SSH_PATH, data));
ipcMain.handle("load-ssh", () => readJSON(SSH_PATH, []));

// Notes / scratchpad
const NOTES_PATH = path.join(app.getPath("userData"), "notes.json");
ipcMain.on("save-notes", (_, data) => writeJSON(NOTES_PATH, data));
ipcMain.handle("load-notes", () => readJSON(NOTES_PATH, { text: "" }));

// Terminal logging
const LOG_DIR = path.join(app.getPath("userData"), "logs");
ipcMain.on("log-append", (_, paneId, data) => {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const logFile = path.join(LOG_DIR, `terminal-${paneId}.log`);
    fs.appendFileSync(logFile, data);
  } catch {}
});
ipcMain.handle("get-log-path", (_, paneId) => {
  return path.join(LOG_DIR, `terminal-${paneId}.log`);
});

// Docker containers
ipcMain.handle("docker-ps", async () => {
  try {
    const { execSync } = require("child_process");
    const result = execSync('docker ps --format "{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}" 2>/dev/null', {
      encoding: "utf8", timeout: 5000
    }).trim();
    if (!result) return [];
    return result.split("\n").map(line => {
      const [id, name, image, status, ports] = line.split("\t");
      return { id, name, image, status, ports: ports || "" };
    });
  } catch { return []; }
});

ipcMain.handle("docker-ps-all", async () => {
  try {
    const { execSync } = require("child_process");
    const result = execSync('docker ps -a --format "{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}" 2>/dev/null', {
      encoding: "utf8", timeout: 5000
    }).trim();
    if (!result) return [];
    return result.split("\n").map(line => {
      const [id, name, image, status] = line.split("\t");
      return { id, name, image, status };
    });
  } catch { return []; }
});

// Environment variables for a terminal
ipcMain.handle("get-terminal-env", async (_, id) => {
  const p = ptys.get(id);
  if (!p) return [];
  try {
    const { execSync } = require("child_process");
    const result = execSync(
      `ps eww -o command= -p ${p.pid} 2>/dev/null || cat /proc/${p.pid}/environ 2>/dev/null | tr '\\0' '\\n'`,
      { encoding: "utf8", timeout: 3000 }
    ).trim();
    // Fallback: just return process.env filtered
    const envPairs = [];
    for (const [k, v] of Object.entries(process.env)) {
      envPairs.push({ key: k, value: v });
    }
    return envPairs.sort((a, b) => a.key.localeCompare(b.key));
  } catch {
    const envPairs = [];
    for (const [k, v] of Object.entries(process.env)) {
      envPairs.push({ key: k, value: v });
    }
    return envPairs.sort((a, b) => a.key.localeCompare(b.key));
  }
});

// File preview
ipcMain.handle("read-file", async (_, filePath, maxBytes) => {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return { error: "Is a directory", isDir: true };
    const limit = maxBytes || 50000;
    if (stat.size > limit) {
      const buf = Buffer.alloc(limit);
      const fd = fs.openSync(filePath, "r");
      fs.readSync(fd, buf, 0, limit, 0);
      fs.closeSync(fd);
      return { content: buf.toString("utf8"), truncated: true, size: stat.size };
    }
    return { content: fs.readFileSync(filePath, "utf8"), truncated: false, size: stat.size };
  } catch (e) { return { error: e.message }; }
});

// Directory bookmarks
const BOOKMARKS_PATH = path.join(app.getPath("userData"), "bookmarks.json");
ipcMain.on("save-bookmarks", (_, data) => writeJSON(BOOKMARKS_PATH, data));
ipcMain.handle("load-bookmarks", () => readJSON(BOOKMARKS_PATH, []));

// Get child process tree for smart naming
ipcMain.handle("get-process-tree", async (_, id) => {
  const p = ptys.get(id);
  if (!p) return null;
  try {
    const { execSync } = require("child_process");
    // Get full process tree: PID, PPID, COMMAND
    const result = execSync(
      `pgrep -P ${p.pid} 2>/dev/null | xargs -I{} ps -o pid=,comm=,args= -p {} 2>/dev/null`,
      { encoding: "utf8", timeout: 2000 }
    ).trim();
    if (!result) return null;
    const lines = result.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    // Return the deepest child (most specific process)
    const last = lines[lines.length - 1];
    const parts = last.trim().split(/\s+/);
    const pid = parts[0];
    const comm = parts[1];
    const args = parts.slice(2).join(" ");
    return { pid, comm, args };
  } catch { return null; }
});

ipcMain.on("toggle-fullscreen", () => {
  if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

ipcMain.on("quit-app", () => {
  for (const [, p] of ptys) p.kill();
  app.quit();
});
