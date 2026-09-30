// Report generation module for Git Secret Audit Desktop
// Exports findings to JSON, CSV, SARIF formats

import fs from "fs";
import path from "path";
import { Finding, ScanResult } from "./scanner";

export interface ReportOptions {
  format: "json" | "csv" | "sarif";
  outputPath: string;
  includeMetadata: boolean;
}

export function generateReport(result: ScanResult, options: ReportOptions): void {
  switch (options.format) {
    case "json":
      generateJSON(result, options);
      break;
    case "csv":
      generateCSV(result, options);
      break;
    case "sarif":
      generateSARIF(result, options);
      break;
  }
}

function generateJSON(result: ScanResult, options: ReportOptions): void {
  const output = options.includeMetadata ? result : { findings: result.findings };
  fs.writeFileSync(options.outputPath, JSON.stringify(output, null, 2));
}

function generateCSV(result: ScanResult, options: ReportOptions): void {
  const headers = [
    "ID", "Rule ID", "File Path", "Commit Hash", "Line Number",
    "Severity", "Verified", "Message"
  ];

  const rows = result.findings.map(f => [
    f.id,
    f.ruleId,
    f.filePath,
    f.commitHash,
    f.lineNumber.toString(),
    f.severity,
    f.verified ? "true" : "false",
    `"${f.message.replace(/"/g, '""')}"`,
  ]);

  const content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  fs.writeFileSync(options.outputPath, content);
}

function generateSARIF(result: ScanResult, options: ReportOptions): void {
  const sarif = {
    $schema: "https://schemastore.org/schemas/json/sarif.json",
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "Git Secret Audit",
          version: "1.0.0",
          informationUri: "https://github.com/ardahankanatli021/git-secret-audit-desktop-2026",
          rules: [...new Set(result.findings.map(f => f.ruleId))].map(id => ({
            id,
            name: id,
            shortDescription: { text: `Secret detection rule: ${id}` },
            defaultConfiguration: { level: "warning" },
          })),
        },
      },
      results: result.findings.map(f => ({
        ruleId: f.ruleId,
        level: mapSeverityToSARIF(f.severity),
        message: { text: f.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: f.filePath },
            region: { startLine: f.lineNumber },
          },
        }],
        properties: {
          commitHash: f.commitHash,
          verified: f.verified ?? false,
        },
      }]),
      invocations: [{
        executionSuccessful: true,
        startTimeUtc: result.timestamp,
      }],
    }],
  };

  fs.writeFileSync(options.outputPath, JSON.stringify(sarif, null, 2));
}

function mapSeverityToSARIF(severity: string): "error" | "warning" | "note" | "none" {
  switch (severity) {
    case "critical": return "error";
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "note";
    default: return "note";
  }
}

export function generateSummaryReport(result: ScanResult): string {
  const { summary, findings, timestamp, repoPath } = result;
  const lines = [
    "Git Secret Audit Desktop - Scan Report",
    "=".repeat(50),
    `Repository: ${repoPath}`,
    `Scan Time: ${timestamp}`,
    `Scan ID: ${result.scanId}`,
    "",
    "Summary:",
    `- Total Findings: ${summary.secretsFound}`,
    `- Critical: ${summary.critical}`,
    `- High: ${summary.high}`,
    `- Medium: ${summary.medium}`,
    `- Low: ${summary.low}`,
    "",
    "Findings:",
  ];

  findings.forEach((f, i) => {
    lines.push(
      `${i + 1}. [${f.severity.toUpperCase()}] ${f.ruleId}`,
      `   File: ${f.filePath}:${f.lineNumber}`,
      `   Commit: ${f.commitHash}`,
      `   Verified: ${f.verified ? "Yes" : "No"}`,
      `   ${f.message}`,
      ""
    );
  });

  return lines.join("\n");
}

export function exportFindings(findings: Finding[], format: "json" | "csv" | "sarif", outputPath: string): void {
  const mockResult: ScanResult = {
    repoPath: "",
    scanId: Date.now().toString(),
    timestamp: new Date().toISOString(),
    findings,
    summary: {
      totalScanned: findings.length,
      secretsFound: findings.length,
      critical: findings.filter(f => f.severity === "critical").length,
      high: findings.filter(f => f.severity === "high").length,
      medium: findings.filter(f => f.severity === "medium").length,
      low: findings.filter(f => f.severity === "low").length,
    },
    status: "completed",
  };
  generateReport(mockResult, { format, outputPath, includeMetadata: false });
}