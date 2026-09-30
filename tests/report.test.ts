// Tests for report generation module
// Git Secret Audit Desktop

import { generateReport, generateSummaryReport, exportFindings } from "../src/report";
import { ScanResult, Finding } from "../src/scanner";
import fs from "fs";
import path from "path";
import os from "os";

describe("Report Generation", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "report-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const mockFindings: Finding[] = [
    {
      id: "f1",
      ruleId: "aws-access-key-id",
      filePath: "src/config.ts",
      commitHash: "abc12345",
      lineNumber: 42,
      secret: "AKIAIOSFODNN7EXAMPLE",
      severity: "critical",
      entropy: 4.2,
      verified: false,
      message: "AWS Access Key ID detected in configuration file",
    },
    {
      id: "f2",
      ruleId: "github-pat",
      filePath: ".env",
      commitHash: "def67890",
      lineNumber: 3,
      secret: "ghp_abcdefghijklmnopqrstuvwxyz123456",
      severity: "high",
      entropy: 4.8,
      verified: true,
      message: "GitHub Personal Access Token detected",
    },
    {
      id: "f3",
      ruleId: "generic-api-key",
      filePath: "api/client.ts",
      commitHash: "ghi12345",
      lineNumber: 15,
      secret: "sk_live_abcdefghijklmnop",
      severity: "medium",
      verified: false,
      message: "Stripe secret key detected",
    },
  ];

  const mockResult: ScanResult = {
    repoPath: "/test/repo",
    scanId: "scan-1234567890",
    timestamp: "2026-01-15T10:30:00.000Z",
    findings: mockFindings,
    summary: {
      totalScanned: 150,
      secretsFound: 3,
      critical: 1,
      high: 1,
      medium: 1,
      low: 0,
    },
    status: "completed",
  };

  describe("generateReport - JSON format", () => {
    it("should generate valid JSON report", () => {
      const outputPath = path.join(tempDir, "report.json");
      generateReport(mockResult, { format: "json", outputPath, includeMetadata: true });

      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty("repoPath", "/test/repo");
      expect(parsed).toHaveProperty("scanId", "scan-1234567890");
      expect(parsed).toHaveProperty("findings");
      expect(parsed.findings).toHaveLength(3);
    });

    it("should generate JSON without metadata when includeMetadata is false", () => {
      const outputPath = path.join(tempDir, "report-no-meta.json");
      generateReport(mockResult, { format: "json", outputPath, includeMetadata: false });

      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);

      expect(parsed).not.toHaveProperty("repoPath");
      expect(parsed).toHaveProperty("findings");
      expect(parsed.findings).toHaveLength(3);
    });
  });

  describe("generateReport - CSV format", () => {
    it("should generate valid CSV report", () => {
      const outputPath = path.join(tempDir, "report.csv");
      generateReport(mockResult, { format: "csv", outputPath, includeMetadata: true });

      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, "utf8");
      const lines = content.trim().split("\n");

      expect(lines[0]).toBe("ID,Rule ID,File Path,Commit Hash,Line Number,Severity,Verified,Message");
      expect(lines).toHaveLength(4); // header + 3 findings
      expect(lines[1]).toContain("f1");
      expect(lines[1]).toContain("aws-access-key-id");
      expect(lines[1]).toContain("critical");
    });
  });

  describe("generateReport - SARIF format", () => {
    it("should generate valid SARIF report", () => {
      const outputPath = path.join(tempDir, "report.sarif");
      generateReport(mockResult, { format: "sarif", outputPath, includeMetadata: true });

      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty("$schema");
      expect(parsed.$schema).toContain("sarif");
      expect(parsed).toHaveProperty("version", "2.1.0");
      expect(parsed).toHaveProperty("runs");
      expect(parsed.runs).toHaveLength(1);
      expect(parsed.runs[0]).toHaveProperty("tool");
      expect(parsed.runs[0].tool.driver).toHaveProperty("name", "Git Secret Audit");
      expect(parsed.runs[0]).toHaveProperty("results");
      expect(parsed.runs[0].results).toHaveLength(3);
    });

    it("should map severities correctly in SARIF", () => {
      const outputPath = path.join(tempDir, "report.sarif");
      generateReport(mockResult, { format: "sarif", outputPath, includeMetadata: true });

      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);

      const results = parsed.runs[0].results;
      const criticalResult = results.find((r: any) => r.ruleId === "aws-access-key-id");
      const highResult = results.find((r: any) => r.ruleId === "github-pat");
      const mediumResult = results.find((r: any) => r.ruleId === "generic-api-key");

      expect(criticalResult.level).toBe("error");
      expect(highResult.level).toBe("error");
      expect(mediumResult.level).toBe("warning");
    });
  });

  describe("generateSummaryReport", () => {
    it("should generate human-readable summary", () => {
      const summary = generateSummaryReport(mockResult);

      expect(summary).toContain("Git Secret Audit Desktop - Scan Report");
      expect(summary).toContain("/test/repo");
      expect(summary).toContain("scan-1234567890");
      expect(summary).toContain("Total Findings: 3");
      expect(summary).toContain("Critical: 1");
      expect(summary).toContain("High: 1");
      expect(summary).toContain("Medium: 1");
      expect(summary).toContain("aws-access-key-id");
      expect(summary).toContain("github-pat");
    });
  });

  describe("exportFindings", () => {
    it("should export findings in JSON format", () => {
      const outputPath = path.join(tempDir, "findings.json");
      exportFindings(mockFindings, "json", outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);
      expect(parsed.findings).toHaveLength(3);
    });

    it("should export findings in CSV format", () => {
      const outputPath = path.join(tempDir, "findings.csv");
      exportFindings(mockFindings, "csv", outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, "utf8");
      expect(content).toContain("ID,Rule ID");
    });

    it("should export findings in SARIF format", () => {
      const outputPath = path.join(tempDir, "findings.sarif");
      exportFindings(mockFindings, "sarif", outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);
      expect(parsed.runs[0].results).toHaveLength(3);
    });
  });
});