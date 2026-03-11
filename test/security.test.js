const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');

// ============================================================
// Re-implement validation helpers from main.js for direct testing
// (They live inside main.js module scope and cannot be imported)
// ============================================================
function sanitizePath(p) {
  if (typeof p !== "string") return null;
  if (p.includes("\0")) return null;
  const resolved = path.resolve(p);
  if (p.includes("../") || p.includes("..\\")) return null;
  return resolved;
}

function isValidHost(h) {
  return typeof h === "string" && h.length > 0 && h.length <= 255 && /^[a-zA-Z0-9._\-]+$/.test(h);
}

function isValidUser(u) {
  return typeof u === "string" && u.length > 0 && u.length <= 64 && /^[a-zA-Z0-9._\-]+$/.test(u);
}

function isValidPort(p) {
  const n = Number(p);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

// kill-port PID validation (mirrors main.js logic)
function isValidPid(pid) {
  const n = parseInt(pid, 10);
  return Number.isInteger(n) && n > 0;
}

// read-file maxBytes validation (mirrors main.js logic)
function isValidMaxBytes(maxBytes) {
  if (maxBytes === undefined) return true;
  return typeof maxBytes === "number" && maxBytes > 0 && maxBytes <= 10 * 1024 * 1024;
}

// ============================================================
// Tests
// ============================================================

describe('sanitizePath', () => {
  it('rejects null byte injection', () => {
    assert.strictEqual(sanitizePath('/home/user/file\0.txt'), null);
  });

  it('rejects ../ traversal', () => {
    assert.strictEqual(sanitizePath('/home/user/../../../etc/passwd'), null);
  });

  it('rejects ..\\ traversal (Windows-style)', () => {
    assert.strictEqual(sanitizePath('C:\\Users\\..\\..\\Windows\\system32'), null);
  });

  it('resolves valid absolute paths', () => {
    const result = sanitizePath('/home/user/projects/file.txt');
    assert.strictEqual(result, path.resolve('/home/user/projects/file.txt'));
  });

  it('resolves valid relative paths without traversal', () => {
    const result = sanitizePath('somefile.txt');
    assert.strictEqual(typeof result, 'string');
    assert.ok(path.isAbsolute(result));
  });

  it('returns null for non-string input (number)', () => {
    assert.strictEqual(sanitizePath(123), null);
  });

  it('returns null for non-string input (null)', () => {
    assert.strictEqual(sanitizePath(null), null);
  });

  it('returns null for non-string input (undefined)', () => {
    assert.strictEqual(sanitizePath(undefined), null);
  });

  it('returns null for non-string input (object)', () => {
    assert.strictEqual(sanitizePath({ path: '/tmp' }), null);
  });

  it('handles empty string by resolving to cwd', () => {
    const result = sanitizePath('');
    assert.strictEqual(result, path.resolve(''));
  });
});

describe('isValidHost', () => {
  it('accepts simple hostname', () => {
    assert.strictEqual(isValidHost('myhost'), true);
  });

  it('accepts FQDN', () => {
    assert.strictEqual(isValidHost('server.example.com'), true);
  });

  it('accepts IPv4 address', () => {
    assert.strictEqual(isValidHost('192.168.1.100'), true);
  });

  it('accepts hostname with hyphens', () => {
    assert.strictEqual(isValidHost('my-server-01'), true);
  });

  it('rejects empty string', () => {
    assert.strictEqual(isValidHost(''), false);
  });

  it('rejects special characters (semicolon)', () => {
    assert.strictEqual(isValidHost('host;rm -rf /'), false);
  });

  it('rejects special characters (space)', () => {
    assert.strictEqual(isValidHost('host name'), false);
  });

  it('rejects strings longer than 255 chars', () => {
    assert.strictEqual(isValidHost('a'.repeat(256)), false);
  });

  it('accepts string at max length (255)', () => {
    assert.strictEqual(isValidHost('a'.repeat(255)), true);
  });

  it('rejects non-string input', () => {
    assert.strictEqual(isValidHost(42), false);
    assert.strictEqual(isValidHost(null), false);
  });
});

describe('isValidUser', () => {
  it('accepts simple username', () => {
    assert.strictEqual(isValidUser('deploy'), true);
  });

  it('accepts username with dots and hyphens', () => {
    assert.strictEqual(isValidUser('john.doe-admin'), true);
  });

  it('accepts username with underscores', () => {
    assert.strictEqual(isValidUser('my_user'), true);
  });

  it('rejects empty string', () => {
    assert.strictEqual(isValidUser(''), false);
  });

  it('rejects special characters (backtick)', () => {
    assert.strictEqual(isValidUser('user`whoami`'), false);
  });

  it('rejects strings longer than 64 chars', () => {
    assert.strictEqual(isValidUser('u'.repeat(65)), false);
  });

  it('accepts string at max length (64)', () => {
    assert.strictEqual(isValidUser('u'.repeat(64)), true);
  });
});

describe('isValidPort', () => {
  it('accepts port 1', () => {
    assert.strictEqual(isValidPort(1), true);
  });

  it('accepts port 80', () => {
    assert.strictEqual(isValidPort(80), true);
  });

  it('accepts port 443', () => {
    assert.strictEqual(isValidPort(443), true);
  });

  it('accepts port 65535', () => {
    assert.strictEqual(isValidPort(65535), true);
  });

  it('rejects port 0', () => {
    assert.strictEqual(isValidPort(0), false);
  });

  it('rejects negative port', () => {
    assert.strictEqual(isValidPort(-1), false);
  });

  it('rejects port above 65535', () => {
    assert.strictEqual(isValidPort(65536), false);
  });

  it('rejects NaN', () => {
    assert.strictEqual(isValidPort(NaN), false);
  });

  it('rejects string "abc"', () => {
    assert.strictEqual(isValidPort("abc"), false);
  });

  it('accepts numeric string "22"', () => {
    assert.strictEqual(isValidPort("22"), true);
  });

  it('rejects float 80.5', () => {
    assert.strictEqual(isValidPort(80.5), false);
  });
});

describe('kill-port PID validation', () => {
  it('accepts positive integer', () => {
    assert.strictEqual(isValidPid(1234), true);
  });

  it('accepts PID 1', () => {
    assert.strictEqual(isValidPid(1), true);
  });

  it('rejects zero', () => {
    assert.strictEqual(isValidPid(0), false);
  });

  it('rejects negative number', () => {
    assert.strictEqual(isValidPid(-5), false);
  });

  it('rejects non-numeric string', () => {
    assert.strictEqual(isValidPid("abc"), false);
  });

  it('accepts numeric string', () => {
    assert.strictEqual(isValidPid("42"), true);
  });
});

describe('read-file maxBytes validation', () => {
  it('accepts undefined (optional param)', () => {
    assert.strictEqual(isValidMaxBytes(undefined), true);
  });

  it('accepts valid size (1024)', () => {
    assert.strictEqual(isValidMaxBytes(1024), true);
  });

  it('rejects zero', () => {
    assert.strictEqual(isValidMaxBytes(0), false);
  });

  it('rejects negative number', () => {
    assert.strictEqual(isValidMaxBytes(-100), false);
  });

  it('rejects exceeding 10MB', () => {
    assert.strictEqual(isValidMaxBytes(10 * 1024 * 1024 + 1), false);
  });

  it('accepts exactly 10MB', () => {
    assert.strictEqual(isValidMaxBytes(10 * 1024 * 1024), true);
  });

  it('rejects non-number types', () => {
    assert.strictEqual(isValidMaxBytes("1024"), false);
    assert.strictEqual(isValidMaxBytes(null), false);
  });
});
