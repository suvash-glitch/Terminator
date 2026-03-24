const { describe, it } = require('node:test');
const assert = require('node:assert');

// ============================================================
// Plugin manifest validation logic
// (Shellfire supports theme and command plugins via plugin.json)
// ============================================================

const VALID_PLUGIN_TYPES = ['theme', 'command', 'keybinding'];

function validatePluginManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null object'] };
  }
  if (typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    errors.push('Missing or empty "name" field');
  }
  if (typeof manifest.type !== 'string' || !VALID_PLUGIN_TYPES.includes(manifest.type)) {
    errors.push(`Invalid or missing "type" field (must be one of: ${VALID_PLUGIN_TYPES.join(', ')})`);
  }
  if (manifest.version !== undefined && typeof manifest.version !== 'string') {
    errors.push('"version" must be a string if provided');
  }
  return { valid: errors.length === 0, errors };
}

function validateThemePlugin(output) {
  if (!output || typeof output !== 'object') return false;
  const required = ['name', 'background', 'foreground'];
  return required.every(k => typeof output[k] === 'string' && output[k].length > 0);
}

function validateCommandPlugin(output) {
  if (!output || typeof output !== 'object') return false;
  return typeof output.command === 'string' && output.command.length > 0;
}

// ============================================================
// Tests
// ============================================================

describe('Plugin manifest validation', () => {
  it('accepts valid theme plugin', () => {
    const manifest = { name: 'My Theme', type: 'theme', version: '1.0.0' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('accepts valid command plugin', () => {
    const manifest = { name: 'Git Helper', type: 'command' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, true);
  });

  it('accepts valid keybinding plugin', () => {
    const manifest = { name: 'Vim Keys', type: 'keybinding', version: '0.1.0' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, true);
  });

  it('rejects manifest with missing name', () => {
    const manifest = { type: 'theme' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('name')));
  });

  it('rejects manifest with empty name', () => {
    const manifest = { name: '  ', type: 'theme' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, false);
  });

  it('rejects manifest with missing type', () => {
    const manifest = { name: 'Broken' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('type')));
  });

  it('rejects manifest with unknown type', () => {
    const manifest = { name: 'BadPlugin', type: 'widget' };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, false);
  });

  it('rejects null manifest', () => {
    const result = validatePluginManifest(null);
    assert.strictEqual(result.valid, false);
  });

  it('rejects non-object manifest', () => {
    const result = validatePluginManifest('not an object');
    assert.strictEqual(result.valid, false);
  });

  it('rejects manifest with numeric version', () => {
    const manifest = { name: 'Test', type: 'theme', version: 1.0 };
    const result = validatePluginManifest(manifest);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('version')));
  });
});

describe('Theme plugin output format', () => {
  it('accepts valid theme output', () => {
    const output = { name: 'Ocean', background: '#001122', foreground: '#ffffff' };
    assert.strictEqual(validateThemePlugin(output), true);
  });

  it('rejects theme missing background', () => {
    const output = { name: 'Bad', foreground: '#fff' };
    assert.strictEqual(validateThemePlugin(output), false);
  });

  it('rejects theme with empty name', () => {
    const output = { name: '', background: '#000', foreground: '#fff' };
    assert.strictEqual(validateThemePlugin(output), false);
  });

  it('rejects null output', () => {
    assert.strictEqual(validateThemePlugin(null), false);
  });
});

describe('Command plugin output format', () => {
  it('accepts valid command output', () => {
    const output = { command: 'git status', label: 'Git Status' };
    assert.strictEqual(validateCommandPlugin(output), true);
  });

  it('rejects command with empty string', () => {
    const output = { command: '' };
    assert.strictEqual(validateCommandPlugin(output), false);
  });

  it('rejects missing command field', () => {
    const output = { label: 'oops' };
    assert.strictEqual(validateCommandPlugin(output), false);
  });

  it('rejects null output', () => {
    assert.strictEqual(validateCommandPlugin(null), false);
  });
});
