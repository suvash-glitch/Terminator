# Changelog

All notable changes to Shellfire will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added

#### Terminal Core
- Terminal multiplexing with flexible grid layout (horizontal/vertical splits)
- Tab support with drag-to-reorder
- Pane zoom (fullscreen toggle for any pane)
- Pane resizing via drag handles
- Pane locking to prevent accidental input
- Pane color tagging for visual identification
- Broadcast mode — send keystrokes to all panes simultaneously
- Smart paste confirmation for large clipboard content
- GPU-accelerated rendering via xterm.js WebGL addon
- Configurable font size (8-24px) with `Cmd+=` / `Cmd+-`
- 6 built-in themes: Dark, Solarized Dark, Dracula, Monokai, Nord, Light
- Find-in-terminal with search highlighting

#### AI Integration
- AI Autocomplete with Claude-powered ghost text suggestions
- Claude Code integration for launching AI sessions from any pane
- Configurable AI provider and API key via settings

#### IDE Mode
- Sidebar with project grouping and tree navigation
- Editor-style tabs for focused single-pane work
- Multi-pane split view within IDE mode

#### Command Palette & Productivity
- Command palette (`Cmd+P`) with fuzzy search across all actions
- Quick command bar (`Cmd+;`) for fast command execution
- Command snippets — save, organize, and recall frequently used commands
- Layout profiles — save and restore named workspace configurations
- Directory bookmarks for quick navigation
- File finder across projects

#### Session Management
- Session save and restore with full scrollback preservation
- Auto-save at configurable intervals (default: 60 seconds)
- Session auto-restore on app launch

#### SSH & Remote
- SSH bookmark manager with host, port, user, and password storage
- Remote session discovery (tmux/screen sessions on remote hosts)

#### DevOps Tools
- Port manager — view listening ports, identify and kill processes
- Docker container viewer with status, image, and uptime
- Cron job manager UI
- Pipeline runner for multi-step command execution
- System resource monitoring (CPU, RAM, disk) per pane

#### Terminal Enhancements
- Git branch and status display in pane headers
- Keyword watchers with output notifications
- Terminal output logging to file
- Environment variable viewer
- Scratchpad / notes panel
- Clickable URLs in terminal output (web-links addon)
- Configurable scrollback buffer limit

#### CLI
- Full CLI (`shellfire`) for external scripting and control
- Commands: list, new, attach, send, kill, rename, remote
- Zsh completion script with dynamic session name completion

#### App Infrastructure
- Cross-platform builds (macOS DMG/ZIP, Windows NSIS/ZIP, Linux AppImage/DEB)
- Auto-updater via electron-updater
- Single instance lock — second launch focuses existing window
- Onboarding flow for first-time users
- Context-isolated renderer with preload bridge for security
- Structured logging with timestamps

### Security
- All renderer-to-main communication goes through a context-isolated preload bridge
- API keys stored locally in user data directory (never transmitted except to configured AI provider)
- Smart paste confirmation prevents accidental execution of large clipboard content
