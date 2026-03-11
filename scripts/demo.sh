#!/usr/bin/env bash
#
# Terminator Demo Script
# ======================
# Run this script while Terminator is open, then screen-record the app
# to create a demo GIF or video showcasing Terminator's features.
#
# Prerequisites:
#   - Terminator must be running (the app, not just this script)
#   - The `terminator` CLI must be in your PATH
#     (or use the full path: ./bin/terminator)
#
# Usage:
#   chmod +x scripts/demo.sh
#   ./scripts/demo.sh
#
# Tip: Use a tool like `kap`, `licecap`, or `asciinema` to record
# the Terminator window while this script runs.

set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PAUSE=2  # seconds between steps (gives the viewer time to read)

step() {
  echo ""
  echo "========================================"
  echo "  STEP: $1"
  echo "========================================"
  echo ""
  sleep "$PAUSE"
}

info() {
  echo "  -> $1"
}

# ---------------------------------------------------------------------------
# Pre-flight check
# ---------------------------------------------------------------------------

if ! command -v terminator &>/dev/null; then
  echo "Error: 'terminator' CLI not found in PATH."
  echo "Make sure Terminator is installed and the CLI is linked."
  echo "You can also run: node bin/terminator-cli.js"
  exit 1
fi

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║       Terminator Feature Demo            ║"
echo "  ║  Start screen-recording now!             ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
sleep 3

# ---------------------------------------------------------------------------
# 1. List existing sessions
# ---------------------------------------------------------------------------

step "List current sessions"
info "Running: terminator list"
terminator list
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 2. Create a new named session
# ---------------------------------------------------------------------------

step "Create a named terminal session"
info "Running: terminator new -t 'frontend'"
terminator new -t "frontend"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 3. Create a second session with a working directory
# ---------------------------------------------------------------------------

step "Create another session with a specific working directory"
info "Running: terminator new -t 'backend' -d ~/Desktop"
terminator new -t "backend" -d ~/Desktop
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 4. Create a third session for monitoring
# ---------------------------------------------------------------------------

step "Create a monitoring session"
info "Running: terminator new -t 'monitor'"
terminator new -t "monitor"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 5. List all sessions to show what we created
# ---------------------------------------------------------------------------

step "List all sessions (should show 3 new ones)"
info "Running: terminator list"
terminator list
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 6. Send commands to each session
# ---------------------------------------------------------------------------

step "Send commands to sessions"

info "Sending 'echo Hello from the frontend!' to 'frontend'"
terminator send -t "frontend" "echo 'Hello from the frontend!'"
sleep 1

info "Sending 'ls -la' to 'backend'"
terminator send -t "backend" "ls -la"
sleep 1

info "Sending a system info command to 'monitor'"
terminator send -t "monitor" "uname -a && echo '---' && uptime"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 7. Rename a session
# ---------------------------------------------------------------------------

step "Rename a session"
info "Running: terminator rename -t 'frontend' 'React App'"
terminator rename -t "frontend" "React App"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 8. Verify the rename
# ---------------------------------------------------------------------------

step "List sessions to confirm the rename"
info "Running: terminator list"
terminator list
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 9. Send a longer workflow to a session
# ---------------------------------------------------------------------------

step "Simulate a dev workflow in the backend session"
info "Sending a series of commands to 'backend'"

terminator send -t "backend" "echo '=== Starting backend workflow ==='"
sleep 1
terminator send -t "backend" "echo 'Checking Node version...' && node --version"
sleep 1
terminator send -t "backend" "echo 'Checking npm version...' && npm --version"
sleep 1
terminator send -t "backend" "echo '=== Workflow complete ==='"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 10. Send a monitoring command
# ---------------------------------------------------------------------------

step "Start a live process in the monitor session"
info "Sending 'top -l 1 | head -20' to 'monitor' (macOS) or 'top -bn1 | head -20' (Linux)"

if [[ "$(uname)" == "Darwin" ]]; then
  terminator send -t "monitor" "top -l 1 | head -20"
else
  terminator send -t "monitor" "top -bn1 | head -20"
fi
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 11. Attach to a session (brief)
# ---------------------------------------------------------------------------

step "Focus/attach to the 'React App' session"
info "Running: terminator attach -t 'React App'"
info "(This brings that pane into focus in the Terminator UI)"
terminator attach -t "React App"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 12. Clean up - kill the demo sessions
# ---------------------------------------------------------------------------

step "Clean up: kill demo sessions"

info "Running: terminator kill -t 'React App'"
terminator kill -t "React App"
sleep 1

info "Running: terminator kill -t 'backend'"
terminator kill -t "backend"
sleep 1

info "Running: terminator kill -t 'monitor'"
terminator kill -t "monitor"
sleep "$PAUSE"

# ---------------------------------------------------------------------------
# 13. Final listing
# ---------------------------------------------------------------------------

step "Final session list (demo sessions removed)"
terminator list

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║       Demo complete!                     ║"
echo "  ║  You can stop recording now.             ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Features demonstrated:"
echo "    - Creating named terminal sessions"
echo "    - Creating sessions with working directories"
echo "    - Listing all sessions"
echo "    - Sending commands to sessions"
echo "    - Renaming sessions"
echo "    - Attaching/focusing sessions"
echo "    - Killing sessions"
echo ""
echo "  Features to show manually (keyboard shortcuts):"
echo "    - Cmd+D / Cmd+Shift+D  -> Split panes"
echo "    - Cmd+P                -> Command palette"
echo "    - Cmd+Shift+B          -> Broadcast mode"
echo "    - Cmd+Shift+Enter      -> Zoom pane"
echo "    - Ctrl+Shift+T         -> Cycle themes"
echo "    - Cmd+Shift+S          -> Save session"
echo ""
