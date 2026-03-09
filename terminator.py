#!/usr/bin/env python3
"""
Terminator - A terminal multiplexer with grid layout.

Keybindings:
  Ctrl+A, c       - Create new terminal pane
  Ctrl+A, x       - Close active pane
  Ctrl+A, Arrow    - Navigate between panes
  Ctrl+A, q       - Quit
  Everything else  - Sent to the active terminal
"""

import curses
import os
import pty
import select
import signal
import struct
import fcntl
import termios
import sys

CTRL_A = 1


def set_pty_size(fd, rows, cols):
    """Resize a pty to the given dimensions."""
    winsize = struct.pack("HHHH", rows, cols, 0, 0)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)


class Pane:
    def __init__(self, rows, cols):
        self.pid, self.fd = pty.openpty()
        self.child_pid = os.fork()
        if self.child_pid == 0:
            # Child process
            os.close(self.pid)
            os.setsid()
            fcntl.ioctl(self.fd, termios.TIOCSCTTY, 0)
            os.dup2(self.fd, 0)
            os.dup2(self.fd, 1)
            os.dup2(self.fd, 2)
            if self.fd > 2:
                os.close(self.fd)
            shell = os.environ.get("SHELL", "/bin/zsh")
            os.execvp(shell, [shell])
        else:
            os.close(self.fd)
            self.fd = self.pid  # master side
            fl = fcntl.fcntl(self.fd, fcntl.F_GETFL)
            fcntl.fcntl(self.fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
            self.buffer = []  # list of lines (each line is a list of chars)
            self.buffer.append([])
            self.cursor_r = 0
            self.cursor_c = 0
            self.rows = rows
            self.cols = cols
            self.scroll_top = 0
            set_pty_size(self.fd, rows, cols)
            self.alive = True

    def resize(self, rows, cols):
        self.rows = rows
        self.cols = cols
        if self.alive:
            try:
                set_pty_size(self.fd, rows, cols)
            except OSError:
                self.alive = False

    def read(self):
        if not self.alive:
            return
        try:
            data = os.read(self.fd, 65536)
            if not data:
                self.alive = False
                return
            self._process(data)
        except (OSError, IOError):
            pass

    def _process(self, data):
        """Process raw terminal output - basic VT100 handling."""
        i = 0
        d = data
        while i < len(d):
            b = d[i]
            if b == 0x1b:  # ESC
                # Parse escape sequence
                if i + 1 < len(d) and d[i + 1] == ord('['):
                    # CSI sequence
                    i += 2
                    params = ""
                    while i < len(d) and (chr(d[i]).isdigit() or d[i] == ord(';') or d[i] == ord('?')):
                        params += chr(d[i])
                        i += 1
                    if i < len(d):
                        cmd = chr(d[i])
                        i += 1
                        self._handle_csi(params, cmd)
                    continue
                elif i + 1 < len(d) and d[i + 1] == ord(']'):
                    # OSC sequence - skip until ST or BEL
                    i += 2
                    while i < len(d) and d[i] != 0x07:
                        if d[i] == 0x1b and i + 1 < len(d) and d[i + 1] == ord('\\'):
                            i += 1
                            break
                        i += 1
                    i += 1
                    continue
                elif i + 1 < len(d):
                    i += 2  # skip unknown ESC + char
                    continue
                else:
                    i += 1
                    continue
            elif b == ord('\r'):
                self.cursor_c = 0
            elif b == ord('\n'):
                self.cursor_r += 1
                if self.cursor_r >= len(self.buffer):
                    self.buffer.append([])
                if self.cursor_r - self.scroll_top >= self.rows:
                    self.scroll_top = self.cursor_r - self.rows + 1
            elif b == ord('\t'):
                next_tab = ((self.cursor_c // 8) + 1) * 8
                self.cursor_c = min(next_tab, self.cols - 1)
            elif b == 0x08:  # backspace
                if self.cursor_c > 0:
                    self.cursor_c -= 1
            elif b == 0x07:  # bell
                pass
            elif b >= 0x20:
                # Printable character
                while self.cursor_r >= len(self.buffer):
                    self.buffer.append([])
                line = self.buffer[self.cursor_r]
                while len(line) <= self.cursor_c:
                    line.append(' ')
                line[self.cursor_c] = chr(b)
                self.cursor_c += 1
                if self.cursor_c >= self.cols:
                    self.cursor_c = 0
                    self.cursor_r += 1
                    if self.cursor_r >= len(self.buffer):
                        self.buffer.append([])
                    if self.cursor_r - self.scroll_top >= self.rows:
                        self.scroll_top = self.cursor_r - self.rows + 1
            i += 1

    def _handle_csi(self, params, cmd):
        """Handle CSI escape sequences."""
        parts = params.replace('?', '').split(';') if params.replace('?', '') else ['']

        def param(idx, default=1):
            try:
                v = int(parts[idx])
                return v if v > 0 else default
            except (IndexError, ValueError):
                return default

        if cmd == 'H' or cmd == 'f':  # Cursor position
            self.cursor_r = self.scroll_top + param(0, 1) - 1
            self.cursor_c = param(1, 1) - 1
            while self.cursor_r >= len(self.buffer):
                self.buffer.append([])
        elif cmd == 'A':  # Cursor up
            self.cursor_r = max(self.scroll_top, self.cursor_r - param(0))
        elif cmd == 'B':  # Cursor down
            self.cursor_r = min(self.scroll_top + self.rows - 1, self.cursor_r + param(0))
            while self.cursor_r >= len(self.buffer):
                self.buffer.append([])
        elif cmd == 'C':  # Cursor forward
            self.cursor_c = min(self.cols - 1, self.cursor_c + param(0))
        elif cmd == 'D':  # Cursor back
            self.cursor_c = max(0, self.cursor_c - param(0))
        elif cmd == 'J':  # Erase display
            p = param(0, 0)
            if p == 2 or p == 3:
                for row_i in range(self.scroll_top, self.scroll_top + self.rows):
                    if row_i < len(self.buffer):
                        self.buffer[row_i] = []
                self.cursor_r = self.scroll_top
                self.cursor_c = 0
            elif p == 0:
                # Clear from cursor to end
                if self.cursor_r < len(self.buffer):
                    self.buffer[self.cursor_r] = self.buffer[self.cursor_r][:self.cursor_c]
                for row_i in range(self.cursor_r + 1, self.scroll_top + self.rows):
                    if row_i < len(self.buffer):
                        self.buffer[row_i] = []
            elif p == 1:
                for row_i in range(self.scroll_top, self.cursor_r):
                    if row_i < len(self.buffer):
                        self.buffer[row_i] = []
                if self.cursor_r < len(self.buffer):
                    line = self.buffer[self.cursor_r]
                    for ci in range(min(self.cursor_c + 1, len(line))):
                        line[ci] = ' '
        elif cmd == 'K':  # Erase line
            p = param(0, 0)
            while self.cursor_r >= len(self.buffer):
                self.buffer.append([])
            line = self.buffer[self.cursor_r]
            if p == 0:
                self.buffer[self.cursor_r] = line[:self.cursor_c]
            elif p == 1:
                for ci in range(min(self.cursor_c + 1, len(line))):
                    line[ci] = ' '
            elif p == 2:
                self.buffer[self.cursor_r] = []
        elif cmd == 'G':  # Cursor horizontal absolute
            self.cursor_c = param(0, 1) - 1
        elif cmd == 'd':  # Cursor vertical absolute
            self.cursor_r = self.scroll_top + param(0, 1) - 1
            while self.cursor_r >= len(self.buffer):
                self.buffer.append([])
        elif cmd == 'r':  # Set scrolling region (ignored for simplicity)
            pass
        elif cmd == 'm':  # SGR - color/style (ignored for display)
            pass
        elif cmd == 'l' or cmd == 'h':  # Mode set/reset
            pass

    def write(self, data):
        if self.alive:
            try:
                os.write(self.fd, data)
            except OSError:
                self.alive = False

    def kill(self):
        if self.alive:
            self.alive = False
            try:
                os.kill(self.child_pid, signal.SIGTERM)
            except ProcessError:
                pass
            try:
                os.close(self.fd)
            except OSError:
                pass

    def render(self, win, start_y, start_x, height, width, active):
        """Render this pane's content into the given window region."""
        # Draw border
        try:
            # Top border
            label = " active " if active else ""
            border_char = "=" if active else "-"
            top = border_char * width
            if label and width > len(label) + 2:
                pos = (width - len(label)) // 2
                top = top[:pos] + label + top[pos + len(label):]
            win.addnstr(start_y, start_x, top[:width], width,
                        curses.color_pair(1) if active else curses.color_pair(2))
        except curses.error:
            pass

        content_y = start_y + 1
        content_h = height - 1
        content_w = width

        for r in range(content_h):
            buf_row = self.scroll_top + r
            line = ""
            if buf_row < len(self.buffer):
                line = "".join(self.buffer[buf_row])
            line = line[:content_w]
            try:
                win.addnstr(content_y + r, start_x, line.ljust(content_w)[:content_w], content_w)
            except curses.error:
                pass

        # Show cursor
        cr = self.cursor_r - self.scroll_top
        cc = self.cursor_c
        if active and 0 <= cr < content_h and 0 <= cc < content_w:
            try:
                win.chgat(content_y + cr, start_x + cc, 1, curses.A_REVERSE)
            except curses.error:
                pass


def compute_grid(n, total_rows, total_cols):
    """Compute grid positions for n panes. Returns list of (y, x, h, w)."""
    if n == 0:
        return []
    if n == 1:
        return [(0, 0, total_rows, total_cols)]

    # Compute rows and cols for grid
    import math
    grid_cols = math.ceil(math.sqrt(n))
    grid_rows = math.ceil(n / grid_cols)

    pane_h = total_rows // grid_rows
    pane_w = total_cols // grid_cols

    positions = []
    idx = 0
    for gr in range(grid_rows):
        # How many panes in this row?
        remaining = n - idx
        remaining_rows = grid_rows - gr
        in_this_row = min(grid_cols, remaining)
        # If it's the last row, maybe fewer panes - center them or stretch
        row_pane_w = total_cols // in_this_row

        y = gr * pane_h
        h = pane_h if gr < grid_rows - 1 else total_rows - y

        for gc in range(in_this_row):
            x = gc * row_pane_w
            w = row_pane_w if gc < in_this_row - 1 else total_cols - x
            positions.append((y, x, h, w))
            idx += 1

    return positions


def main(stdscr):
    curses.curs_set(0)
    curses.start_color()
    curses.use_default_colors()
    curses.init_pair(1, curses.COLOR_GREEN, -1)   # active border
    curses.init_pair(2, curses.COLOR_WHITE, -1)    # inactive border
    stdscr.nodelay(True)
    stdscr.keypad(True)

    max_y, max_x = stdscr.getmaxyx()

    # Start with one pane
    panes = [Pane(max_y - 1, max_x)]  # -1 for border
    active = 0
    prefix_mode = False

    # Status bar message
    status_msg = "Ctrl+A,c:new  Ctrl+A,arrows:nav  Ctrl+A,x:close  Ctrl+A,q:quit"
    status_timer = 200  # show for a while

    while True:
        # Remove dead panes
        dead = [i for i, p in enumerate(panes) if not p.alive]
        for i in sorted(dead, reverse=True):
            try:
                os.close(panes[i].fd)
            except OSError:
                pass
            panes.pop(i)
            if active >= len(panes):
                active = max(0, len(panes) - 1)

        if not panes:
            break

        # Check for terminal resize
        new_y, new_x = stdscr.getmaxyx()
        if new_y != max_y or new_x != max_x:
            max_y, max_x = new_y, new_x

        # Compute grid - reserve 1 row for status bar
        usable_rows = max_y - 1
        positions = compute_grid(len(panes), usable_rows, max_x)

        # Resize panes
        for i, (py, px, ph, pw) in enumerate(positions):
            content_h = ph - 1  # minus border
            if content_h < 1:
                content_h = 1
            panes[i].resize(content_h, pw)

        # Read from all panes
        fds = []
        fd_to_pane = {}
        for p in panes:
            if p.alive:
                fds.append(p.fd)
                fd_to_pane[p.fd] = p

        if fds:
            try:
                readable, _, _ = select.select(fds, [], [], 0.02)
                for fd in readable:
                    fd_to_pane[fd].read()
            except (ValueError, OSError):
                pass

        # Render
        stdscr.erase()
        for i, (py, px, ph, pw) in enumerate(positions):
            if pw > 0 and ph > 0:
                panes[i].render(stdscr, py, px, ph, pw, i == active)

        # Status bar
        status = f" [{len(panes)} panes] Pane {active + 1}/{len(panes)}"
        if status_timer > 0:
            status += f"  |  {status_msg}"
            status_timer -= 1
        try:
            stdscr.addnstr(max_y - 1, 0, status.ljust(max_x)[:max_x - 1], max_x - 1,
                           curses.color_pair(1) | curses.A_BOLD)
        except curses.error:
            pass

        stdscr.refresh()

        # Handle input
        try:
            key = stdscr.getch()
        except curses.error:
            key = -1

        if key == -1:
            continue

        if prefix_mode:
            prefix_mode = False
            if key == ord('c'):
                # New pane
                content_h = max(1, usable_rows // 2 - 1)
                content_w = max(1, max_x // 2)
                panes.append(Pane(content_h, content_w))
                active = len(panes) - 1
                status_msg = f"Created pane {len(panes)}"
                status_timer = 50
            elif key == ord('x'):
                # Close active pane
                if panes:
                    panes[active].kill()
                    status_msg = "Closed pane"
                    status_timer = 50
            elif key == ord('q'):
                # Quit
                for p in panes:
                    p.kill()
                break
            elif key == curses.KEY_RIGHT:
                active = (active + 1) % len(panes)
            elif key == curses.KEY_LEFT:
                active = (active - 1) % len(panes)
            elif key == curses.KEY_DOWN:
                # Move to pane below in grid
                import math
                grid_cols = math.ceil(math.sqrt(len(panes)))
                next_p = active + grid_cols
                if next_p < len(panes):
                    active = next_p
            elif key == curses.KEY_UP:
                import math
                grid_cols = math.ceil(math.sqrt(len(panes)))
                next_p = active - grid_cols
                if next_p >= 0:
                    active = next_p
            elif key == CTRL_A:
                # Send literal Ctrl+A
                if panes and panes[active].alive:
                    panes[active].write(bytes([CTRL_A]))
            continue

        if key == CTRL_A:
            prefix_mode = True
            continue

        # Forward input to active pane
        if panes and panes[active].alive:
            if key == curses.KEY_BACKSPACE or key == 127:
                panes[active].write(b'\x7f')
            elif key == curses.KEY_ENTER or key == 10 or key == 13:
                panes[active].write(b'\r')
            elif key == curses.KEY_UP:
                panes[active].write(b'\x1b[A')
            elif key == curses.KEY_DOWN:
                panes[active].write(b'\x1b[B')
            elif key == curses.KEY_RIGHT:
                panes[active].write(b'\x1b[C')
            elif key == curses.KEY_LEFT:
                panes[active].write(b'\x1b[D')
            elif key == curses.KEY_HOME:
                panes[active].write(b'\x1b[H')
            elif key == curses.KEY_END:
                panes[active].write(b'\x1b[F')
            elif key == curses.KEY_DC:
                panes[active].write(b'\x1b[3~')
            elif 0 <= key < 256:
                panes[active].write(bytes([key]))


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except KeyboardInterrupt:
        pass
    print("Terminator exited.")
