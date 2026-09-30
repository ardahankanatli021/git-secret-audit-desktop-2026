# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-15

### Added
- Initial release of Git Secret Audit Desktop
- Full git history scanning with Gitleaks integration
- TruffleHog integration with credential verification
- Visual dashboard with real-time scan progress
- Interactive findings table with severity filtering
- Baseline management for suppressing known findings
- Export to JSON, CSV, and SARIF formats
- SARIF output compatible with GitHub Security tab
- GitHub repository scanning with PAT authentication
- Monorepo support with per-path allowlists
- Custom Gitleaks rules via `.gitleaks.toml`
- Dark theme UI with styled-components
- Electron + React + TypeScript architecture

### Security
- Local-only processing, no data upload
- Redacted secrets in memory and reports
- Electron context isolation and CSP
- Verified bundled scanner binaries

### Documentation
- Installation guide
- Usage guide with CLI examples
- Configuration reference
- CI/CD integration examples (GitHub Actions, Azure DevOps)

## [Unreleased]

### Planned
- macOS support (Apple Silicon + Intel)
- Linux support via AppImage
- GitLab and Bitbucket repository integration
- Scheduled scans with notifications
- Team dashboard for organization-wide monitoring
- Slack/Teams integration for alerts
- Web dashboard for remote monitoring
- Community-shared environment profiles

---

## Release Notes Format

### Added
New features and capabilities.

### Changed
Changes in existing functionality.

### Deprecated
Soon-to-be removed features.

### Removed
Now removed features.

### Fixed
Bug fixes.

### Security
Vulnerability fixes and security improvements.