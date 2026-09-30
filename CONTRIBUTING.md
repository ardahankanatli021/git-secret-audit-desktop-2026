# Contributing to Git Secret Audit Desktop

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Issues

- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include steps to reproduce, expected vs actual behavior
- Attach relevant logs and scan results (redacted)

### Suggesting Features

- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Describe the use case and proposed solution
- Consider if it aligns with project scope

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Submit a PR using our [template](.github/PULL_REQUEST_TEMPLATE.md)

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/git-secret-audit-desktop-2026.git
cd git-secret-audit-desktop-2026

# Install dependencies
npm install

# Run in development mode
npm start

# Run tests
npm test

# Run linter
npm run lint
```

## Project Structure

```
src/
├── main.ts           # Electron main process
├── scanner.ts        # Secret scanning logic
├── report.ts         # Report generation
├── baseline.ts       # Baseline management
└── ui/
    ├── Dashboard.tsx # Main UI component
    ├── ScanView.tsx  # Scan progress view
    └── ReportView.tsx# Findings report view

tests/
├── scanner.test.ts   # Scanner unit tests
└── report.test.ts    # Report tests
```

## Coding Standards

- **TypeScript** with strict mode enabled
- **ESLint** + **Prettier** for formatting
- **Jest** for unit tests
- **Styled Components** for UI styling
- **Functional components** with hooks for React

### TypeScript Guidelines

- Use strict typing (`strict: true`)
- Avoid `any` - use proper types
- Export interfaces from their defining module
- Use meaningful names for types and interfaces

### Commit Messages

Follow conventional commits:

```
feat(scanner): add support for custom regex rules
fix(report): correct SARIF level mapping for medium severity
docs(usage): update CI/CD integration examples
test(scanner): add baseline filtering tests
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`

## Testing

- Write tests for new functionality
- Maintain >80% code coverage
- Test both success and error paths
- Mock external dependencies (scanners, filesystem)

## Documentation

- Update relevant docs for any user-facing changes
- Keep code comments current
- Update CHANGELOG.md with notable changes

## Release Process

1. Maintainers create release branch
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Create GitHub Release with artifacts
3. Publish to package managers (if applicable)

## Security

For security issues, see [SECURITY.md](SECURITY.md). Do not report security vulnerabilities in public issues.

## Questions?

Open a discussion or check existing issues before asking.