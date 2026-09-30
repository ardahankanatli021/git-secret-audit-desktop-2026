# Installation Guide

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 (64-bit) | Windows 11 |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 200 MB | 500 MB |
| **Git** | 2.x+ in PATH | Latest version |
| **Node.js** | 20+ (bundled) | 20 LTS |
| **Permissions** | Standard user | Administrator |

## Installation Methods

### Pre-built Release (Recommended)

1. Navigate to the [Releases page](https://github.com/ardahankanatli021/git-secret-audit-desktop-2026/releases)
2. Download the latest `Git-Secret-Audit-Desktop-v1.0.0.zip`
3. Extract with 7-Zip or WinRAR
4. Right-click `GitSecretAudit.exe` and select **Run as administrator**
5. Follow the first-run setup wizard

### From Source

```bash
# Clone the repository
git clone https://github.com/ardahankanatli021/git-secret-audit-desktop-2026.git
cd git-secret-audit-desktop-2026

# Install dependencies
npm install

# Build the application
npm run electron:build

# Run in development mode
npm start
```

### First Run Setup

On first launch, the application will guide you through:

1. **Scanner Verification** - Confirms Gitleaks and TruffleHog are available
2. **Git Configuration** - Verifies Git is in PATH
3. **Default Settings** - Configures scan preferences and output directory
4. **License Acceptance** - MIT License agreement

## Configuration Files

The application creates configuration in:

- **Windows**: `%APPDATA%\GitSecretAudit\`
- **Linux**: `~/.config/GitSecretAudit/`
- **macOS**: `~/Library/Application Support/GitSecretAudit/`

### Default Configuration

```json
{
  "scanners": {
    "gitleaks": { "enabled": true, "version": "latest" },
    "trufflehog": { "enabled": true, "version": "latest", "verify": false }
  },
  "output": {
    "directory": "~/GitSecretAudit/reports",
    "format": "json"
  },
  "ui": {
    "theme": "dark",
    "language": "en"
  }
}
```

## Uninstallation

Run the uninstaller:

```bash
GitSecretAudit.exe --uninstall
```

Or use Windows Settings > Apps > Git Secret Audit Desktop > Uninstall.

The uninstaller removes:
- Application binaries
- Bundled scanners
- Temporary scan files
- Configuration (optional)