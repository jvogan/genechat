# Security Policy

## Architecture

GeneChat is a **client-side only** application. There is no backend server — all data stays in your browser.

- Sequence data is stored in browser IndexedDB
- API requests go directly from browser to the provider you configured
- API keys can be stored in browser IndexedDB (default) or used in session-only mode via API Key Settings
- No telemetry, analytics, or tracking

## BYOK Key Safety

GeneChat is a browser-only BYOK app. If your browser environment is compromised (malicious extension, injected script, malware), API keys may be exposed.

- Prefer low-scope provider keys
- Rotate keys regularly
- Use session-only key mode on shared or high-risk machines

## Supported Versions

Only the latest `main` branch is actively maintained.

## Reporting a Vulnerability

If you discover a security issue, please report it responsibly:

- **Email:** security@genechat.dev
- **GitHub Security Advisories:** Use the "Report a vulnerability" button on the repository's Security tab

Please do **not** open a public issue for security vulnerabilities.

We aim to acknowledge reports within 48 hours and provide a fix or mitigation within 7 days.
