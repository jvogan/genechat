# Security Policy

## Architecture

GeneChat is a **client-side only** application. There is no backend server — all data stays in your browser.

- Sequence data is stored in browser IndexedDB
- API keys are stored in browser IndexedDB (never transmitted to any server other than the provider you configured)
- No telemetry, analytics, or tracking

## Supported Versions

Only the latest `main` branch is actively maintained.

## Reporting a Vulnerability

If you discover a security issue, please report it responsibly:

- **Email:** jacob.vogan@gmail.com
- **GitHub Security Advisories:** Use the "Report a vulnerability" button on the repository's Security tab

Please do **not** open a public issue for security vulnerabilities.

We aim to acknowledge reports within 48 hours and provide a fix or mitigation within 7 days.
