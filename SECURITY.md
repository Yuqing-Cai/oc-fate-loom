# Security policy

## Supported versions

The project is pre-release. Security fixes are applied only to the latest
commit on the default branch and to the current GitHub Pages deployment.

## Reporting a vulnerability

Please do not publish credential exposure, injection, authorization bypass,
or other exploitable details in a public issue.

Use the repository's **Security → Report a vulnerability** flow to submit a
private report when GitHub Private Vulnerability Reporting is available. If
that flow is unavailable, open a minimal public issue asking the maintainer to
establish a private contact channel; do not include exploit details, secrets,
or affected user data in that issue.

Include, when possible:

- affected commit or deployed URL;
- impact and prerequisites;
- minimal reproduction steps with all secrets removed;
- whether the issue may have exposed a project or visitor API key;
- a safe way to confirm the fix.

The maintainer will acknowledge a complete report as soon as practical,
assess severity, and coordinate disclosure after a fix is available. This is
a volunteer project and does not promise a fixed response SLA.

## Suspected key exposure

Revoke and rotate the affected key immediately. Do not wait for repository
history cleanup: removing a secret from the latest commit does not remove it
from prior commits, caches, logs, build artifacts, or forks.

See [docs/security.md](docs/security.md) for the API threat model and release
checklist.
