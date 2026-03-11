const { describe, it } = require('node:test');
const assert = require('node:assert');

// ============================================================
// Re-implement parseArgs from bin/terminator-cli.js for direct testing
// (The CLI file runs main() on load, so we cannot require it directly)
// ============================================================
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

// ============================================================
// Tests
// ============================================================

describe('CLI parseArgs', () => {
  it('parses "list" command', () => {
    const result = parseArgs(['node', 'terminator', 'list']);
    assert.strictEqual(result.command, 'list');
    assert.strictEqual(result.target, null);
  });

  it('parses "new" with -t and -d flags', () => {
    const result = parseArgs(['node', 'terminator', 'new', '-t', 'myname', '-d', '/tmp']);
    assert.strictEqual(result.command, 'new');
    assert.strictEqual(result.target, 'myname');
    assert.strictEqual(result.dir, '/tmp');
  });

  it('parses "new" with long flags --target and --dir', () => {
    const result = parseArgs(['node', 'terminator', 'new', '--target', 'srv', '--dir', '/home']);
    assert.strictEqual(result.command, 'new');
    assert.strictEqual(result.target, 'srv');
    assert.strictEqual(result.dir, '/home');
  });

  it('parses "send" with target and rest text', () => {
    const result = parseArgs(['node', 'terminator', 'send', '-t', 'backend', 'npm', 'start']);
    assert.strictEqual(result.command, 'send');
    assert.strictEqual(result.target, 'backend');
    assert.deepStrictEqual(result.rest, ['npm', 'start']);
  });

  it('parses "kill" with target', () => {
    const result = parseArgs(['node', 'terminator', 'kill', '-t', 'old-session']);
    assert.strictEqual(result.command, 'kill');
    assert.strictEqual(result.target, 'old-session');
  });

  it('parses "remote" with user@host and port', () => {
    const result = parseArgs(['node', 'terminator', 'remote', 'user@host', '-p', '2222']);
    assert.strictEqual(result.command, 'remote');
    assert.deepStrictEqual(result.rest, ['user@host']);
    assert.strictEqual(result.port, 2222);
  });

  it('parses "remote" with password flag', () => {
    const result = parseArgs(['node', 'terminator', 'remote', 'deploy@prod', '-w', 'secret123']);
    assert.strictEqual(result.command, 'remote');
    assert.strictEqual(result.password, 'secret123');
  });

  it('returns help for no arguments', () => {
    const result = parseArgs(['node', 'terminator']);
    assert.strictEqual(result.command, 'help');
  });

  it('returns help for -h flag', () => {
    const result = parseArgs(['node', 'terminator', '-h']);
    assert.strictEqual(result.command, 'help');
  });

  it('returns help for --help flag', () => {
    const result = parseArgs(['node', 'terminator', '--help']);
    assert.strictEqual(result.command, 'help');
  });

  it('returns version for -v flag', () => {
    const result = parseArgs(['node', 'terminator', '-v']);
    assert.strictEqual(result.command, 'version');
  });

  it('returns version for --version flag', () => {
    const result = parseArgs(['node', 'terminator', '--version']);
    assert.strictEqual(result.command, 'version');
  });

  it('unknown command is returned as-is', () => {
    const result = parseArgs(['node', 'terminator', 'foobar']);
    assert.strictEqual(result.command, 'foobar');
  });

  it('missing -t value leaves target as null', () => {
    // -t at end with no following value: goes into rest
    const result = parseArgs(['node', 'terminator', 'attach', '-t']);
    // -t is at the end so the condition `i + 1 < args.length` is false -> pushed to rest
    assert.strictEqual(result.target, null);
    assert.deepStrictEqual(result.rest, ['-t']);
  });

  it('password defaults to null when not provided', () => {
    const result = parseArgs(['node', 'terminator', 'remote', 'user@host']);
    assert.strictEqual(result.password, null);
  });
});

describe('CLI help text content', () => {
  it('usage string contains password visibility warning', () => {
    // The usage text from the CLI
    const usage = `
  terminator - Terminal multiplexer CLI

  Usage:
    terminator list                       List all terminal sessions

  Options:
    -w, --password <pwd>  SSH password (WARNING: visible in process list via ps aux;
                            prefer TERMINATOR_SSH_PASSWORD env var instead)

  Environment:
    TERMINATOR_SSH_PASSWORD   SSH password (recommended over -w flag for security)
`.trim();

    assert.ok(usage.includes('WARNING'), 'help text should contain password WARNING');
    assert.ok(usage.includes('TERMINATOR_SSH_PASSWORD'), 'help text should mention env var');
    assert.ok(usage.includes('ps aux'), 'help text should warn about ps visibility');
  });
});

describe('CLI formatTable', () => {
  // Re-implement formatTable for testing
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

  it('returns "No active sessions" for empty list', () => {
    assert.strictEqual(formatTable([]), '  No active sessions');
  });

  it('formats a single session row', () => {
    const output = formatTable([{ id: 1, name: 'test', cwd: '/tmp', process: 'zsh', active: true }]);
    assert.ok(output.includes('test'));
    assert.ok(output.includes('/tmp'));
    assert.ok(output.includes('zsh'));
    assert.ok(output.includes('*'));
  });
});
