// Secret scanner module for Git Secret Audit Desktop
// Integrates Gitleaks and TruffleHog for comprehensive secret detection

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export interface ScanOptions {
  repoPath: string;
  enableGitleaks: boolean;
  enableTruffleHog: boolean;
  customRulesPath?: string;
  baselinePath?: string;
  outputFormat: "json" | "sarif" | "csv";
  verifyCredentials: boolean;
  maxDepth?: number;
  allowPaths?: string[];
  denyPaths?: string[];
}

export interface Finding {
  id: string;
  ruleId: string;
  filePath: string;
  commitHash: string;
  lineNumber: number;
  secret: string;
  severity: "critical" | "high" | "medium" | "low";
  entropy?: number;
  verified?: boolean;
  message: string;
}

export interface ScanResult {
  repoPath: string;
  scanId: string;
  timestamp: string;
  findings: Finding[];
  summary: {
    totalScanned: number;
    secretsFound: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  status: "running" | "completed" | "error" | "cancelled";
  error?: string;
}

export class SecretScanner {
  private options: ScanOptions;
  private abortController: AbortController | null = null;
  private onProgress?: (progress: { scanned: number; total: number; currentFile: string }) => void;

  constructor(options: ScanOptions) {
    this.options = options;
  }

  public setProgressHandler(handler: typeof this.onProgress): void {
    this.onProgress = handler;
  }

  public async scan(): Promise<ScanResult> {
    this.abortController = new AbortController();
    const scanId = Date.now().toString();
    const startTime = Date.now();

    try {
      if (!fs.existsSync(this.options.repoPath)) {
        throw new Error(`Repository path does not exist: ${this.options.repoPath}`);
      }

      const gitDir = path.join(this.options.repoPath, ".git");
      if (!fs.existsSync(gitDir)) {
        throw new Error("Not a git repository");
      }

      const findings: Finding[] = [];

      if (this.options.enableGitleaks) {
        const gitleaksFindings = await this.runGitleaks(this.options.repoPath);
        findings.push(...gitleaksFindings);
      }

      if (this.options.enableTruffleHog) {
        const truffleHogFindings = await this.runTruffleHog(this.options.repoPath);
        findings.push(...truffleHogFindings);
      }

      const baseline = this.loadBaseline();
      const filteredFindings = this.applyBaseline(findings, baseline);

      const result: ScanResult = {
        repoPath: this.options.repoPath,
        scanId,
        timestamp: new Date().toISOString(),
        findings: filteredFindings,
        summary: this.calculateSummary(filteredFindings),
        status: "completed",
      };

      return result;
    } catch (error) {
      return {
        repoPath: this.options.repoPath,
        scanId,
        timestamp: new Date().toISOString(),
        findings: [],
        summary: { totalScanned: 0, secretsFound: 0, critical: 0, high: 0, medium: 0, low: 0 },
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async runGitleaks(repoPath: string): Promise<Finding[]> {
    return new Promise((resolve, reject) => {
      const args = [
        "detect",
        "--source", repoPath,
        "--report-format", "json",
        "--no-git",
      ];

      if (this.options.customRulesPath) {
        args.push("--config", this.options.customRulesPath);
      }

      if (this.options.allowPaths?.length) {
        args.push("--allowlist-path", this.options.allowPaths.join(","));
      }

      const proc = spawn("gitleaks", args, { signal: this.abortController?.signal });
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => { stdout += data.toString(); });
      proc.stderr.on("data", (data) => { stderr += data.toString(); });

      proc.on("close", (code) => {
        if (code !== 0 && code !== 1) {
          reject(new Error(`Gitleaks exited with code ${code}: ${stderr}`));
          return;
        }
        try {
          const result = JSON.parse(stdout);
          const findings = this.parseGitleaksOutput(result);
          resolve(findings);
        } catch {
          resolve([]);
        }
      });

      proc.on("error", reject);
    });
  }

  private async runTruffleHog(repoPath: string): Promise<Finding[]> {
    return new Promise((resolve, reject) => {
      const args = [
        "git",
        "file://" + repoPath,
        "--json",
        "--no-update",
      ];

      if (!this.options.verifyCredentials) {
        args.push("--no-verification");
      }

      const proc = spawn("trufflehog", args, { signal: this.abortController?.signal });
      let stdout = "";

      proc.stdout.on("data", (data) => { stdout += data.toString(); });

      proc.on("close", (code) => {
        if (code !== 0 && code !== 1) {
          resolve([]);
          return;
        }
        try {
          const findings = this.parseTruffleHogOutput(stdout);
          resolve(findings);
        } catch {
          resolve([]);
        }
      });

      proc.on("error", () => resolve([]));
    });
  }

  private parseGitleaksOutput(output: any[]): Finding[] {
    return output.map((f, index) => ({
      id: `gitleaks-${index}-${Date.now()}`,
      ruleId: f.RuleID,
      filePath: f.File,
      commitHash: f.Commit || "unknown",
      lineNumber: f.StartLine,
      secret: f.Secret || "[REDACTED]",
      severity: this.mapSeverity(f.RuleID),
      entropy: f.Entropy,
      verified: false,
      message: `Detected ${f.RuleID} in ${f.File}:${f.StartLine}`,
    }));
  }

  private parseTruffleHogOutput(output: string): Finding[] {
    const lines = output.trim().split("\n").filter(l => l.trim());
    return lines.map((line, index) => {
      try {
        const data = JSON.parse(line);
        return {
          id: `trufflehog-${index}-${Date.now()}`,
          ruleId: data.DetectorType || "trufflehog",
          filePath: data.SourceMetadata?.Data?.Filesystem?.file || "unknown",
          commitHash: data.SourceMetadata?.Data?.Git?.commit || "unknown",
          lineNumber: data.SourceMetadata?.Data?.Git?.fileLine || 0,
          secret: data.Raw || "[REDACTED]",
          severity: data.Verified ? "critical" : "high",
          verified: data.Verified === true,
          message: `TruffleHog detected ${data.DetectorType} in ${data.SourceMetadata?.Data?.Filesystem?.file || "unknown"}`,
        };
      } catch {
        return null;
      }
    }).filter((f): f is Finding => f !== null);
  }

  private mapSeverity(ruleId: string): "critical" | "high" | "medium" | "low" {
    const criticalPatterns = ["aws-secret", "private-key", "ssh-key", "database-password"];
    const highPatterns = ["api-key", "token", "secret", "password", "github-pat", "stripe"];
    const mediumPatterns = ["certificate", "jwt", "oauth"];

    const ruleLower = ruleId.toLowerCase();
    if (criticalPatterns.some(p => ruleLower.includes(p))) return "critical";
    if (highPatterns.some(p => ruleLower.includes(p))) return "high";
    if (mediumPatterns.some(p => ruleLower.includes(p))) return "medium";
    return "low";
  }

  private loadBaseline(): Map<string, Finding> {
    if (!this.options.baselinePath || !fs.existsSync(this.options.baselinePath)) {
      return new Map();
    }
    try {
      const content = fs.readFileSync(this.options.baselinePath, "utf8");
      const baseline = JSON.parse(content);
      const map = new Map<string, Finding>();
      if (baseline.findings) {
        baseline.findings.forEach((f: Finding) => {
          const key = `${f.filePath}:${f.lineNumber}:${f.ruleId}`;
          map.set(key, f);
        });
      }
      return map;
    } catch {
      return new Map();
    }
  }

  private applyBaseline(findings: Finding[], baseline: Map<string, Finding>): Finding[] {
    return findings.filter(f => {
      const key = `${f.filePath}:${f.lineNumber}:${f.ruleId}`;
      return !baseline.has(key);
    });
  }

  private calculateSummary(findings: Finding[]): ScanResult["summary"] {
    return {
      totalScanned: findings.length,
      secretsFound: findings.length,
      critical: findings.filter(f => f.severity === "critical").length,
      high: findings.filter(f => f.severity === "high").length,
      medium: findings.filter(f => f.severity === "medium").length,
      low: findings.filter(f => f.severity === "low").length,
    };
  }
}

export function createScanner(options: ScanOptions): SecretScanner {
  return new SecretScanner(options);
}