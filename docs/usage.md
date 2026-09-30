# Usage Guide

## Quick Start

### Scanning a Local Repository

1. Launch Git Secret Audit Desktop
2. Enter the repository path in the sidebar (e.g., `C:\Projects\my-app`)
3. Click **Start Scan**
4. Review findings in the Report view
5. Export results as needed

### Scanning a GitHub Repository

1. Click the GitHub icon in the repository input
2. Enter the repository URL: `https://github.com/owner/repo`
3. Provide a Personal Access Token with `repo` scope
4. Click **Start Scan**

The application clones the repository to a temporary directory, scans it, and cleans up afterward.

## Scan Modes

### Full History Scan (Default)

Scans the entire commit history of the repository. Detects secrets that were added and later removed.

```bash
# CLI equivalent
GitSecretAudit.exe --source /path/to/repo --full-history
```

### Changed Files Only

Scans only files modified in the current branch since the base branch. Ideal for PR checks.

```bash
# CLI equivalent
GitSecretAudit.exe --source /path/to/repo --changed-only --base main
```

### Staged Changes

Scans only staged changes before commit. Use with pre-commit hooks.

```bash
# CLI equivalent
GitSecretAudit.exe --source /path/to/repo --staged
```

## Understanding Findings

Each finding includes:

| Field | Description |
|-------|-------------|
| **Severity** | Critical / High / Medium / Low |
| **Rule ID** | Detection rule that matched (e.g., `aws-access-key-id`) |
| **File Path** | Relative path to the file containing the secret |
| **Line Number** | Exact line where the secret was found |
| **Commit Hash** | Git commit where the secret appears |
| **Verified** | Whether TruffleHog confirmed the credential is active |

### Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Active credentials with high impact (AWS keys, DB passwords) | Rotate immediately |
| **High** | Valid tokens/API keys (GitHub PATs, Stripe keys) | Rotate within 24 hours |
| **Medium** | Potential secrets, unverified credentials | Review and rotate if valid |
| **Low** | Low-entropy strings, certificates | Document and monitor |

## Baseline Management

### Creating a Baseline

1. Run an initial scan
2. Review all findings
3. For each acceptable finding (test fixtures, examples), click **Add to Baseline**
4. Provide a justification for each entry
5. Save the baseline file

### Using a Baseline

1. In Settings, enable **Use Baseline**
2. Select your baseline file (`.baseline.json`)
3. Future scans will suppress matched findings
4. New secrets will still be detected

### Baseline Format

```json
{
  "version": "1.0",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "entries": [
    {
      "finding": { "ruleId": "generic-api-key", "filePath": "test/fixtures/api.ts", "lineNumber": 10, "severity": "medium" },
      "justification": "Test fixture with dummy key",
      "author": "dev@example.com",
      "timestamp": "2026-01-15T10:35:00.000Z"
    }
  ]
}
```

## Export Formats

### JSON
Complete scan data for programmatic processing.

### CSV
Spreadsheet-compatible format for reporting.

### SARIF
Static Analysis Results Interchange Format for CI/CD integration.

```bash
# Generate SARIF for GitHub Security tab
GitSecretAudit.exe --source . --format sarif --output results.sarif
```

Upload to GitHub:
```bash
gh api repos/owner/repo/code-scanning/sarifs \
  --method POST \
  --field sarif=@results.sarif \
  --field category=git-secret-audit
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Secret Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download Git Secret Audit
        run: |
          # Download and extract
      - name: Run Scan
        run: GitSecretAudit.exe --cli --source . --format sarif --output results.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

### Azure DevOps

```yaml
- task: PowerShell@2
  inputs:
    targetType: 'inline'
    script: |
      .\GitSecretAudit.exe --cli --source $(Build.SourcesDirectory) --format sarif --output $(Build.ArtifactStagingDirectory)/results.sarif
- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: $(Build.ArtifactStagingDirectory)/results.sarif
    artifactName: SecretScanResults
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Git not found" | Install Git and ensure it's in PATH |
| "Scanner not found" | Run as Administrator to allow bundled scanner extraction |
| "Permission denied" | Run as Administrator or check folder permissions |
| "No findings but secrets exist" | Check `.gitleaks.toml` allowlist rules |
| "High memory usage" | Reduce scan depth or exclude large directories |