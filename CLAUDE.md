# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Terminator is an AI-powered terminal multiplexer built with Electron. It provides split panes, tabs, AI autocomplete (Claude), SSH bookmarks, Docker management, a plugin system with 100+ extensions, and a CLI — all in a single desktop app for macOS, Windows, and Linux.

## Commands

```bash
npm start             # Launch app in dev mode (electron .)
npm run rebuild       # Rebuild native modules (node-pty) — required after npm install
npm test              # Run all tests (Node.js built-in test runner)
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run build         # Build macOS distributable (.dmg, .zip)
npm run build:win     # Build Windows distributable (.exe, .zip)
npm run build:linux   # Build Linux distributable (.AppImage, .deb)
```

Run a single test file:
```bash
node --test test/main.test.js
```

## Architecture

The app follows Electron's two-process model with strict context isolation:

- **`main.js`** — Main process. Manages PTY lifecycles (node-pty), all IPC handlers, a Unix socket server for CLI communication (`~/.terminator/terminator.sock`), file I/O, git/docker/ssh/cron integrations, plugin loading, and the marketplace.

- **`preload.js`** — Context bridge. Exposes 100+ safe IPC methods to the renderer via `contextBridge.exposeInMainWorld`. All renderer↔main communication goes through this bridge.

- **`renderer.js`** — Renderer process. All DOM/UI logic: pane/tab/split management, xterm.js terminal instances (WebGL-accelerated), command palette, settings, IDE mode with sidebar, theme switching, and the plugin API (`window._termExt`).

- **`index.html`** — Single-page app shell with modals and overlays.

- **`styles.css`** — All styling. Themes are implemented via CSS custom properties (6 built-in: Dark, Solarized, Dracula, Monokai, Nord, Light).

### Plugin System

Plugins live in the user's data directory and are hot-loaded at runtime. Each plugin is a folder with `plugin.json` (metadata) + `index.js` (code). Types: `theme`, `command`, `extension`, `statusbar`. The plugin API is exposed at `window._termExt` with hooks (`terminalInput`, `errorDetected`, `contextMenu`) and UI injection methods (`addToolbarButton`, `addSidePanel`, `registerCommand`).

- `registry/plugins.json` — Central metadata for all 100+ official plugins
- `registry/plugins/` — Official plugin source code
- `registry/packages/` — Pre-built `.termext` zip bundles
- `examples/plugins/` — Plugin starter templates

### CLI

`bin/terminator-cli.js` communicates with the running app over a Unix socket. Commands: `list`, `new`, `attach`, `send`, `kill`, `rename`, `remote`. Zsh completions in `bin/_terminator`.

## Code Style

- 2-space indentation, double quotes, always semicolons
- `const` by default, `let` when needed, never `var`
- `function` declarations in main process; arrow functions fine in renderer
- `// ====` section dividers separate major feature blocks in large files
- camelCase for variables/functions, PascalCase for classes
- Commit messages: prefix with `Add`, `Fix`, `Update`, `Remove`, `Refactor`, `Docs`, `Test`

## Build Prerequisites

- Node.js 18+, npm 9+
- Python 3.x (for node-pty native compilation)
- Xcode Command Line Tools (macOS) or equivalent C++ build tools
