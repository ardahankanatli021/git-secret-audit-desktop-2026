# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please email security@ardahankanatli021.example.com with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a status update within 5 business days.

## Security Features

### Local-Only Processing

- All scanning occurs on your machine
- No repository data leaves your system
- No telemetry or usage data collected
- Network communication only for:
  - GitHub API (private repo access with your token)
  - Update checks (optional)

### Credential Handling

- Detected secrets are **redacted in memory** after processing
- Reports exclude actual secret values by default
- SARIF export includes only metadata, not secrets
- Baseline files store finding metadata, not secrets

### Scanner Security

- Bundled Gitleaks and TruffleHog binaries are verified
- Scanner versions pinned in releases
- No arbitrary code execution from scanned content
- Temporary clone directories cleaned after scan

### Electron Security

- Context isolation enabled
- Node integration disabled in renderer
- Preload scripts for IPC communication
- Content Security Policy enforced
- External navigation blocked

## Best Practices for Users

1. **Run as Standard User** - No admin required for scanning
2. **Use Read-Only Tokens** - GitHub PAT with minimal `repo` scope
3. **Review Baseline Justifications** - Document why findings are suppressed
4. **Rotate Detected Secrets** - Treat all findings as compromised
4. **Keep Updated** - Install updates for latest scanner rules

## Vulnerability Disclosure Timeline

1. **Day 0** - Vulnerability reported privately
2. **Day 1-2** - Acknowledgment and initial assessment
3. **Day 3-10** - Investigation and fix development
4. **Day 11-14** - Testing and patch preparation
5. **Day 15** - Coordinated disclosure and patch release

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.

## Contact

- Security Email: security@ardahankanatli021.example.com
- PGP Key: Available on request