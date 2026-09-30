# Configuration Reference

## Configuration Files

### Application Settings

Location: `%APPDATA%\GitSecretAudit\settings.json`

```json
{
  "scanners": {
    "gitleaks": {
      "enabled": true,
      "version": "latest",
      "customRulesPath": "",
      "timeout": 300
    },
    "trufflehog": {
      "enabled": true,
      "version": "latest",
      "verifyCredentials": false,
      "timeout": 300
    }
  },
  "output": {
    "directory": "~/GitSecretAudit/reports",
    "format": "json",
    "autoExport": false
  },
  "ui": {
    "theme": "dark",
    "language": "en",
    "showLineNumbers": true,
    "maxHistoryItems": 50
  },
  "git": {
    "shallowClone": false,
    "fetchDepth": 0,
    "includeSubmodules": false
  }
}
```

### Gitleaks Rules (`.gitleaks.toml`)

Place in repository root or specify via `--config`.

```toml
version = 8
mode = "auto"

[config]
  ignore-mainline = true
  download-releases = true

# AWS
[[rules]]
  id = "aws-access-key-id"
  pattern = "AKIA[0-9A-Z]{16}"
  context = ["aws", "access", "key"]
  severity = "high"

[[rules]]
  id = "aws-secret-access-key"
  pattern = "[a-zA-Z0-9/+=]{32,}"
  context = ["aws", "secret", "key"]
  severity = "high"

# GitHub
[[rules]]
  id = "github-pat"
  pattern = "ghp_[A-Za-z0-9]{36}"
  context = ["github", "personal", "access", "token"]
  severity = "high"

# Stripe
[[rules]]
  id = "stripe-secret-key"
  pattern = "sk_(live|test)_[0-9a-zA-Z]{24}"
  context = ["stripe", "secret"]
  severity = "high"

# Generic
[[rules]]
  id = "generic-api-key"
  pattern = "[a-zA-Z0-9]{32,}"
  context = ["api", "key"]
  severity = "medium"

# Allowlist
[allowlist]
  description = "Test fixtures and examples"
  paths = [
    "test/**/*_test.go",
    "test/fixtures/**",
    "examples/**",
    "*.snapshot"
  ]
  regexes = [
    "EXAMPLE_KEY",
    "DUMMY_SECRET",
    "test.*key",
    "fake.*token"
  ]
  commits = []
```

### Baseline (`.baseline.json`)

```json
{
  "version": "1.0",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z",
  "entries": [
    {
      "finding": {
        "id": "f1",
        "ruleId": "generic-api-key",
        "filePath": "test/fixtures/config.ts",
        "commitHash": "abc123",
        "lineNumber": 5,
        "secret": "***",
        "severity": "medium",
        "message": "Test API key"
      },
      "justification": "Test fixture with non-functional key",
      "author": "dev@example.com",
      "timestamp": "2026-01-15T10:35:00.000Z",
      "expiresAt": "2026-12-31T23:59:59.000Z"
    }
  ],
  "metadata": {
    "repoPath": "/path/to/repo",
    "totalSuppressed": 1,
    "scanners": ["gitleaks", "trufflehog"]
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GSA_CONFIG_DIR` | Override config directory | Platform default |
| `GSA_REPORT_DIR` | Override report output directory | `~/GitSecretAudit/reports` |
| `GSA_GITLEAKS_PATH` | Custom Gitleaks binary path | Bundled |
| `GSA_TRUFFLEHOG_PATH` | Custom TruffleHog binary path | Bundled |
| `GSA_LOG_LEVEL` | Log level: debug, info, warn, error | `info` |
| `GITHUB_TOKEN` | GitHub PAT for private repos | None |

## CLI Options

```bash
GitSecretAudit.exe [OPTIONS]

Options:
  --source PATH              Repository path or GitHub URL (required)
  --format FORMAT            Output format: json, csv, sarif (default: json)
  --output PATH              Output file path
  --config PATH              Custom Gitleaks config path
  --baseline PATH            Baseline file path
  --full-history             Scan full git history (default)
  --changed-only             Scan only changed files
  --staged                   Scan only staged changes
  --base BRANCH              Base branch for changed-only (default: main)
  --verify                   Verify credentials with TruffleHog
  --no-verify                Skip credential verification (default)
  --allow PATH               Allow paths (comma-separated)
  --deny PATH                Deny paths (comma-separated)
  --cli                      Run in CLI mode (no GUI)
  --uninstall                Uninstall application
  --version                  Show version
  --help                     Show help
```

## Custom Rules

### Adding Custom Patterns

Create `.gitleaks-custom.toml`:

```toml
[[rules]]
  id = "internal-api-key"
  pattern = "INT_API_[A-Z0-9]{20}"
  context = ["internal", "api"]
  severity = "high"
  description = "Internal API key pattern"
```

Reference in settings:
```json
{
  "scanners": {
    "gitleaks": {
      "customRulesPath": ".gitleaks-custom.toml"
    }
  }
}
```

### Regex Testing

Test patterns before adding:

```bash
# Test with Gitleaks directly
gitleaks detect --source . --config .gitleaks-custom.toml --report-format json
```

## Performance Tuning

### Large Repositories

- Enable `shallowClone` for faster initial clone
- Set `fetchDepth` to limit history (e.g., `50` for last 50 commits)
- Use `--changed-only` for incremental scans
- Add large directories to allowlist

### Memory Optimization

- Reduce concurrent scanner processes
- Increase `timeout` for large repos
- Exclude binary files and dependencies

```json
{
  "git": {
    "shallowClone": true,
    "fetchDepth": 100
  },
  "scanners": {
    "gitleaks": { "timeout": 600 },
    "trufflehog": { "timeout": 600 }
  }
}
```