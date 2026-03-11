# Terminator

A modern terminal multiplexer built with Electron.

## Features

- **Terminal multiplexing** with flexible grid layout
- **Pane splitting** (horizontal/vertical), zooming, and resizing
- **Session save/restore** with full scrollback preservation
- **6 built-in themes** -- Dark, Solarized Dark, Dracula, Monokai, Nord, and Light
- **Command palette** (Cmd+P)
- **Snippet management** for frequently used commands
- **Profile saving** with reusable layout templates
- **Quick Launch projects** with Claude integration
- **SSH bookmark manager**
- **Cron job manager** UI
- **Docker container viewer**
- **System resource monitoring** -- CPU, RAM, and Disk
- **Git branch/status display** per pane
- **Keyword watchers** for output monitoring
- **Smart paste confirmation** for large pastes
- **Tab drag reorder**, pane color tagging, and locking
- **Broadcast mode** -- send input to all panes simultaneously
- **Scratchpad/notes panel**
- **Terminal output logging**
- **Environment variable viewer**
- **Quick command bar** (Cmd+;)
- **File finder** across projects
- **Directory bookmarks**

## Installation

```bash
git clone <repo-url>
cd Terminator
npm install
npm run rebuild
npm start
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Cmd+T | New Terminal |
| Cmd+Shift+T | New Terminal (Same Dir) |
| Cmd+D | Split Right |
| Cmd+Shift+D | Split Down |
| Cmd+W | Close Pane |
| Cmd+P | Command Palette |
| Cmd+F | Find in Terminal |
| Cmd+Shift+F | File Finder |
| Cmd+K | Clear Terminal |
| Cmd+Shift+Enter | Zoom Pane |
| Cmd+Shift+B | Broadcast Mode |
| Cmd+Shift+R | Snippets |
| Cmd+Shift+S | Save Session |
| Cmd+; | Quick Command |
| Cmd+1-9 | Jump to Pane |
| Cmd+Arrow | Navigate Panes |
| Cmd+= / Cmd+- | Font Size |

## Tech Stack

- **Electron** v35
- **xterm.js** v5.4 + addons (fit, search, web-links, WebGL)
- **node-pty** for PTY management

## Development

```bash
npm start        # Launch the app
npm run rebuild  # Rebuild native modules
```

## License

MIT
