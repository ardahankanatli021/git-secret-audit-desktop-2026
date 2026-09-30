// Baseline management for Git Secret Audit Desktop
// Allows suppressing known findings while continuing to catch new leaks

import fs from "fs";
import path from "path";
import { Finding } from "./scanner";

export interface BaselineEntry {
  finding: Finding;
  justification: string;
  author: string;
  timestamp: string;
  expiresAt?: string;
}

export interface Baseline {
  version: string;
  createdAt: string;
  updatedAt: string;
  entries: BaselineEntry[];
  metadata: {
    repoPath: string;
    totalSuppressed: number;
    scanners: string[];
  };
}

const CURRENT_VERSION = "1.0";

export function createBaseline(repoPath: string, scanners: string[] = ["gitleaks", "trufflehog"]): Baseline {
  return {
    version: CURRENT_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: [],
    metadata: {
      repoPath,
      totalSuppressed: 0,
      scanners,
    },
  };
}

export function loadBaseline(baselinePath: string): Baseline | null {
  if (!fs.existsSync(baselinePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(baselinePath, "utf8");
    const baseline = JSON.parse(content) as Baseline;
    return validateBaseline(baseline) ? baseline : null;
  } catch {
    return null;
  }
}

export function saveBaseline(baselinePath: string, baseline: Baseline): void {
  baseline.updatedAt = new Date().toISOString();
  baseline.metadata.totalSuppressed = baseline.entries.length;
  const dir = path.dirname(baselinePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
}

export function addBaselineEntry(
  baseline: Baseline,
  finding: Finding,
  justification: string,
  author: string,
  expiresAt?: Date
): Baseline {
  const entry: BaselineEntry = {
    finding,
    justification,
    author,
    timestamp: new Date().toISOString(),
    expiresAt: expiresAt?.toISOString(),
  };

  const key = `${finding.filePath}:${finding.lineNumber}:${finding.ruleId}`;
  const existingIndex = baseline.entries.findIndex(e => 
    `${e.finding.filePath}:${e.finding.lineNumber}:${e.finding.ruleId}` === key
  );

  if (existingIndex >= 0) {
    baseline.entries[existingIndex] = entry;
  } else {
    baseline.entries.push(entry);
  }

  return baseline;
}

export function removeBaselineEntry(baseline: Baseline, finding: Finding): Baseline {
  const key = `${finding.filePath}:${finding.lineNumber}:${finding.ruleId}`;
  baseline.entries = baseline.entries.filter(e => 
    `${e.finding.filePath}:${e.finding.lineNumber}:${e.finding.ruleId}` !== key
  );
  return baseline;
}

export function isSuppressed(baseline: Baseline, finding: Finding): boolean {
  const key = `${finding.filePath}:${finding.lineNumber}:${finding.ruleId}`;
  const entry = baseline.entries.find(e => 
    `${e.finding.filePath}:${e.finding.lineNumber}:${e.finding.ruleId}` === key
  );
  
  if (!entry) return false;
  
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return false;
  }
  
  return true;
}

export function filterFindings(baseline: Baseline, findings: Finding[]): Finding[] {
  return findings.filter(f => !isSuppressed(baseline, f));
}

export function generateBaselineReport(baseline: Baseline): string {
  const lines = [
    "Git Secret Audit Desktop - Baseline Report",
    "=".repeat(50),
    `Repository: ${baseline.metadata.repoPath}`,
    `Created: ${baseline.createdAt}`,
    `Updated: ${baseline.updatedAt}`,
    `Total Suppressed: ${baseline.entries.length}`,
    `Scanners: ${baseline.metadata.scanners.join(", ")}`,
    "",
    "Suppressed Findings:",
  ];

  baseline.entries.forEach((entry, i) => {
    const { finding, justification, author, timestamp, expiresAt } = entry;
    lines.push(
      `${i + 1}. [${finding.severity.toUpperCase()}] ${finding.ruleId}`,
      `   File: ${finding.filePath}:${finding.lineNumber}`,
      `   Commit: ${finding.commitHash}`,
      `   Justification: ${justification}`,
      `   Author: ${author}`,
      `   Added: ${timestamp}`,
      expiresAt ? `   Expires: ${expiresAt}` : "   Expires: Never",
      ""
    );
  });

  return lines.join("\n");
}

export function mergeBaselines(base: Baseline, incoming: Baseline): Baseline {
  const merged = { ...base, entries: [...base.entries] };
  incoming.entries.forEach(entry => {
    const key = `${entry.finding.filePath}:${entry.finding.lineNumber}:${entry.finding.ruleId}`;
    const existingIndex = merged.entries.findIndex(e => 
      `${e.finding.filePath}:${e.finding.lineNumber}:${e.finding.ruleId}` === key
    );
    if (existingIndex >= 0) {
      if (new Date(entry.timestamp) > new Date(merged.entries[existingIndex].timestamp)) {
        merged.entries[existingIndex] = entry;
      }
    } else {
      merged.entries.push(entry);
    }
  });
  merged.updatedAt = new Date().toISOString();
  return merged;
}

function validateBaseline(baseline: any): baseline is Baseline {
  return (
    baseline &&
    typeof baseline.version === "string" &&
    Array.isArray(baseline.entries) &&
    baseline.metadata &&
    typeof baseline.metadata.repoPath === "string"
  );
}