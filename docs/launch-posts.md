# Shellfire Launch Posts

Ready-to-post content for launching Shellfire across platforms.

---

## 1. Hacker News (Show HN)

**Title:** Show HN: Shellfire -- Open-source AI-powered terminal multiplexer

**Body:**

I built Shellfire because I was tired of juggling a terminal emulator, tmux, and a dozen DevOps browser tabs. Shellfire is an open-source terminal multiplexer built with Electron and xterm.js that combines pane splitting, session management, and developer tooling into a single app. It has a full CLI for scripting (`shellfire new`, `shellfire send`, etc.), session save/restore, SSH bookmarks with remote session discovery, broadcast mode for multi-server commands, and a command palette for quick access to everything.

The part I'm most interested in feedback on is the AI integration. Shellfire uses the Anthropic API to provide ghost-text autocomplete suggestions as you type in the terminal, and you can launch Claude Code sessions directly from any pane. It's opt-in (bring your own API key) and doesn't phone home otherwise. The rest of the feature set -- Docker container overview, port manager, keyword watchers, pipeline runner, cron manager -- is all local.

Tech stack: Electron v35 with context isolation, xterm.js v5.4 with WebGL rendering, node-pty for native PTY management. Cross-platform: macOS, Windows, Linux. MIT licensed.

GitHub: https://github.com/suvash-glitch/Shellfire
Install (macOS): `brew install --cask shellfire-terminal`

---

## 2. Reddit r/commandline

**Title:** I built Shellfire, an open-source terminal multiplexer with a CLI, command palette, and broadcast mode

**Body:**

Hey r/commandline,

I've been working on Shellfire, a terminal multiplexer that's designed to be controlled from the keyboard and the command line. Wanted to share it and get feedback from people who actually live in the terminal.

**What it does:**

- **Pane splitting** -- horizontal/vertical splits, drag-to-resize, zoom any pane to fullscreen with `Cmd+Shift+Enter`
- **Full CLI** -- `shellfire list`, `shellfire new -t backend -d ~/projects/api`, `shellfire send -t backend "npm start"`, `shellfire kill -t backend`. Comes with Zsh tab completion.
- **Command palette** (`Cmd+P`) -- searchable list of every action: switch panes, change themes, open SSH bookmarks, run saved snippets
- **Broadcast mode** (`Cmd+Shift+B`) -- send keystrokes to every pane at once, useful for configuring multiple servers simultaneously
- **Session save/restore** -- saves your full workspace layout, working directories, and scroll history. Auto-restores on launch.
- **SSH bookmarks** -- save connections, discover running tmux/screen sessions on remote hosts
- **Keyboard-driven** -- `Cmd+1-9` to jump to panes, `Cmd+Arrow` to navigate, `Cmd+D`/`Cmd+Shift+D` to split
- **6 themes** -- Dark, Solarized Dark, Dracula, Monokai, Nord, Light. Cycle with `Ctrl+Shift+T`.
- **Keyword watchers** -- set alerts on terminal output (build finished, test failed, etc.)
- **Command snippets** -- save frequently used commands, recall from the palette

It also has some DevOps tooling built in (Docker container list, port manager, cron manager, pipeline runner) and optional AI autocomplete via the Anthropic API.

Built with Electron + xterm.js + node-pty. Cross-platform (macOS, Windows, Linux). MIT licensed.

GitHub: https://github.com/suvash-glitch/Shellfire

I'd genuinely appreciate feedback, especially on the CLI interface and keyboard shortcuts. What would you want to see added?

---

## 3. Reddit r/terminal

**Title:** Shellfire: a polished terminal multiplexer with themes, IDE mode, and built-in DevOps tools (open source)

**Body:**

Sharing a terminal multiplexer I've been building called Shellfire. I focused on making it visually clean while still being powerful enough to replace tmux + a terminal emulator.

**Visual features:**

- **6 built-in themes** -- Dark, Solarized Dark, Dracula, Monokai, Nord, Light. Switch instantly with `Ctrl+Shift+T`.
- **IDE Mode** -- toggle a sidebar with project grouping and editor-style tabs. Feels like VS Code's integrated terminal, except the terminal IS the app.
- **GPU-accelerated rendering** via xterm.js WebGL addon -- smooth scrolling even with heavy output
- **Per-pane status indicators** -- CPU/memory usage, git branch and status in the pane header
- **Clean pane splitting** with drag-to-resize dividers and a flexible grid layout

**Feature comparison:**

| Feature | Shellfire | iTerm2 | Warp | Hyper |
|---|---|---|---|---|
| Pane splitting | Yes | Yes | Yes | Plugin |
| Session save/restore | Yes | Partial | No | No |
| Command palette | Yes | No | Yes | Plugin |
| Built-in themes | 6 | Yes (many) | Limited | Plugin |
| IDE mode / sidebar | Yes | No | Yes | No |
| CLI for scripting | Yes | Partial | No | No |
| AI autocomplete | Yes (Claude) | No | Yes (built-in) | No |
| Broadcast mode | Yes | Yes | No | No |
| SSH bookmark manager | Yes | Profiles | No | No |
| Docker/port management | Yes | No | No | No |
| Keyword watchers | Yes | Triggers | No | No |
| Cross-platform | Yes | macOS only | macOS only | Yes |
| Open source | MIT | Yes (GPL) | No | MIT |
| Price | Free | Free | Freemium | Free |

Built with Electron v35, xterm.js v5.4 with WebGL, node-pty. Cross-platform.

GitHub: https://github.com/suvash-glitch/Shellfire
Install: `brew install --cask shellfire-terminal`

Would love to hear what you think, especially about the theme and UI design.

---

## 4. Twitter/X

**Post:**

I just open-sourced Shellfire -- an AI-powered terminal multiplexer.

What's in it:
- Pane splitting with drag-to-resize
- Command palette (Cmd+P)
- CLI: `shellfire new`, `shellfire send`, `shellfire list`
- AI autocomplete via Claude
- Session save/restore
- Broadcast mode (type in all panes at once)
- SSH bookmarks + remote session discovery
- Docker, port manager, cron manager built in
- 6 themes, IDE mode, GPU-accelerated

Electron + xterm.js + node-pty. macOS/Windows/Linux. MIT licensed.

GitHub: https://github.com/suvash-glitch/Shellfire

#terminal #opensource #developer #AI #devtools #cli

---

## 5. Dev.to / Blog Post Outline

**Title:** I built an AI-powered terminal multiplexer with Electron

**Subtitle:** How Shellfire combines pane splitting, a CLI, DevOps tools, and Claude AI into one terminal app

**Estimated read time:** 5 minutes

### Section 1: Motivation (why I built this)
- I was constantly switching between my terminal emulator, tmux, browser tabs for Docker, and various monitoring tools
- tmux is powerful but the UX is stuck in the 1980s -- no visual split handles, no command palette, no theming without dotfile surgery
- Warp is interesting but closed-source and macOS-only
- I wanted something that felt like VS Code's terminal but as a standalone app, with the power of tmux and the polish of a modern GUI
- Goal: one app that replaces terminal + tmux + DevOps dashboard

### Section 2: Tech stack decisions
- **Electron v35** -- controversial choice, but needed for cross-platform native PTY access and GPU-accelerated rendering. Context isolation enabled for security.
- **xterm.js v5.4** -- the same terminal engine VS Code uses. WebGL addon for smooth rendering, plus search, fit, and web-links addons.
- **node-pty** -- native module for real PTY management. Required `electron-rebuild` to work with Electron's Node version.
- **electron-builder** for packaging (DMG, EXE, AppImage, deb) and **electron-updater** for auto-updates
- Architecture: main process manages PTY sessions and exposes a Unix socket for CLI communication; renderer handles UI with vanilla JS (no React/Vue)

### Section 3: Key features deep dive
- **Terminal multiplexing**: horizontal/vertical splits, flexible grid, drag-to-resize, zoom-to-fullscreen. How the layout engine works.
- **CLI (`shellfire` command)**: communicates with the running app via a Unix domain socket. Node.js CLI that sends JSON commands. Zsh completion included.
- **Command palette**: inspired by VS Code. Fuzzy search over all actions. How it indexes commands dynamically.
- **Session save/restore**: serializes layout tree, working directories, pane names, and scroll position to JSON. Auto-save on a timer, restore on launch.
- **AI autocomplete**: sends terminal context to Anthropic's API, renders ghost text inline. Opt-in, bring your own key. Also supports launching Claude Code sessions.
- **Broadcast mode**: multiplexes stdin to all active PTYs simultaneously. One toggle.
- **Built-in DevOps tools**: Docker container list (parses `docker ps`), port manager (`lsof`/`netstat`), cron manager, pipeline runner.

### Section 4: Challenges and lessons learned
- **node-pty + Electron compatibility**: native module rebuilding is fragile across platforms. Had to set up per-platform CI builds.
- **Terminal rendering performance**: xterm.js WebGL addon made a huge difference. Canvas fallback for systems without WebGL.
- **Security in Electron**: context isolation, disabled node integration in renderer, IPC-only communication. Why this matters for a terminal app that handles SSH keys and credentials.
- **Cross-platform keyboard shortcuts**: Cmd vs Ctrl, platform-specific path handling, different shell defaults.
- **Unix socket CLI communication**: why sockets over HTTP, handling connection timeouts, attach mode with raw PTY streaming.

### Section 5: What's next
- Plugin system for custom pane types and commands
- Tmux-compatible keybindings mode
- Collaborative terminal sharing (like tmate)
- Better AI integration: natural language to shell commands, error explanation, command suggestion based on project context
- Performance: exploring native rendering alternatives to reduce memory footprint

### Section 6: Try it out
- GitHub link, install instructions, how to contribute
- Looking for feedback on: CLI design, keyboard shortcuts, feature priorities
- MIT licensed, contributions welcome

---

## Posting Tips

- **Hacker News**: Post on a weekday morning (US time, ~9-11am ET). Don't ask for upvotes. Reply to every comment in the first few hours.
- **Reddit**: Post when subreddit is most active (check subreddit stats). Cross-post between r/commandline and r/terminal but adjust the angle.
- **Twitter/X**: Post with a screen recording GIF. Quote-tweet with additional context. Engage with replies.
- **Dev.to**: Publish on Tuesday or Wednesday morning. Use the #terminal #opensource #electron #ai tags. Include screenshots and GIFs inline.
