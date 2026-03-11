# Contributing to Terminator

Thank you for your interest in contributing to Terminator! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **Python** 3.x (required by node-pty native compilation)
- **Xcode Command Line Tools** (macOS) or equivalent C++ build tools

### Getting Started

```bash
git clone https://github.com/suvash-glitch/Terminator.git
cd Terminator
npm install
npm run rebuild   # compile native modules (node-pty)
npm start         # launch the app
```

### Running Tests

```bash
npm test
```

### Building Distributables

```bash
npm run build         # macOS
npm run build:win     # Windows
npm run build:linux   # Linux
```

## Project Structure

```
Terminator/
  main.js          # Electron main process (PTY management, IPC, file I/O)
  preload.js       # Context bridge (exposes safe APIs to renderer)
  renderer.js      # Renderer process (UI, terminal management, all features)
  index.html       # App shell
  styles.css       # All styles
  bin/
    terminator-cli.js   # CLI entry point
    terminator          # Shell wrapper
    _terminator         # Zsh completion script
  test/            # Test files
  assets/          # Icons and images
```

## Code Style

There is no auto-formatter enforced yet. Please follow these conventions:

- **Indentation:** 2 spaces
- **Quotes:** Double quotes for strings
- **Semicolons:** Always use semicolons
- **Variables:** Use `const` by default, `let` when reassignment is needed, never `var`
- **Functions:** Prefer `function` declarations in the main process; arrow functions are fine in the renderer
- **Comments:** Use `// ====` section dividers to separate major feature blocks in large files
- **Naming:** camelCase for variables and functions, PascalCase for classes

ESLint is configured. You can run `npm run lint` to check and `npm run lint:fix` to auto-fix.

## Submitting Changes

### Pull Requests

1. **Fork** the repository and create a branch from `main`.
2. **Name your branch** descriptively: `feat/pipeline-runner`, `fix/split-resize-bug`, `docs/update-readme`.
3. **Make focused changes.** One feature or fix per PR. Keep diffs reviewable.
4. **Test your changes.** Run `npm test` and verify the app works by launching with `npm start`.
5. **Write a clear PR description.** Explain what changed and why. Include screenshots for UI changes.
6. **Push** to your fork and open a Pull Request against `main`.

### Commit Messages

Use clear, descriptive commit messages:

```
Add port manager kill-process action
Fix pane resize handle not updating on theme change
Update SSH bookmark dialog to show connection status
```

Prefix with the type of change when helpful: `Add`, `Fix`, `Update`, `Remove`, `Refactor`, `Docs`, `Test`.

## Reporting Bugs

Open a [GitHub Issue](https://github.com/suvash-glitch/Terminator/issues/new?template=bug_report.md) with:

- Steps to reproduce
- Expected vs. actual behavior
- OS and version
- Terminator version (from `terminator --version` or the app title bar)
- Any relevant terminal output or screenshots

## Requesting Features

Open a [GitHub Issue](https://github.com/suvash-glitch/Terminator/issues/new?template=feature_request.md) with:

- A clear description of the feature
- Why it would be useful
- Any implementation ideas (optional)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Questions?

Open a GitHub Discussion or Issue. We are happy to help you get started.
