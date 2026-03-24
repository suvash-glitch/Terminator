# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Shellfire, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, use one of the following methods:

1. **GitHub Security Advisories** — [Report a vulnerability](https://github.com/suvash-glitch/Shellfire/security/advisories/new) through GitHub's private disclosure process.
2. **Email** — Send details to the project maintainer directly. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You should receive an acknowledgment within 48 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Security Considerations

### API Keys

- AI API keys (Anthropic/Claude) are stored locally in your user data directory (`settings.json`).
- Keys are never logged, transmitted to third parties, or included in session exports.
- Keys are sent only to the configured AI provider endpoint (e.g., `api.anthropic.com`) when AI features are actively used.

### AI Data

- When AI Autocomplete or Claude Chat is enabled, terminal context (recent lines of output) is sent to the Anthropic API to generate suggestions.
- No data is sent unless you explicitly enable AI features and provide an API key.
- Review [Anthropic's privacy policy](https://www.anthropic.com/privacy) for details on how they handle API data.

### SSH Credentials

- SSH bookmarks can optionally store passwords locally in `settings.json`.
- Passwords are stored in plaintext in the user data directory. For sensitive environments, consider using SSH keys instead and leaving the password field empty.
- SSH credentials are never transmitted anywhere other than the target SSH host.

### Process Isolation

- The renderer process runs in a context-isolated Electron environment.
- All communication between the renderer and main process goes through a restricted preload bridge (`preload.js`).
- The renderer cannot access Node.js APIs, the filesystem, or spawn processes directly.

### Local Data

- Session data, snippets, profiles, and configuration are stored as JSON files in the OS user data directory.
- No data is sent to external servers unless you explicitly use AI features or SSH connections.
- Terminal scrollback is stored in memory and in session files — be mindful of sensitive output when saving sessions.

### Auto-Updater

- Auto-updates are delivered via electron-updater from GitHub Releases.
- Updates are verified against release signatures before installation.

## Best Practices

- Keep Shellfire updated to the latest version.
- Use SSH keys instead of stored passwords when possible.
- Be cautious with Broadcast Mode — keystrokes go to all panes.
- Review session files before sharing them, as they may contain terminal output with sensitive information.
- Rotate your AI API keys periodically.
