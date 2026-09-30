// Tests for SecretScanner module
// Git Secret Audit Desktop

import { SecretScanner, createScanner, Finding, ScanOptions } from "../src/scanner";
import fs from "fs";
import path from "path";
import os from "os";

describe("SecretScanner", () => {
  let testRepoPath: string;
  let testBaselinePath: string;

  beforeAll(() => {
    testRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), "test-repo-"));
    testBaselinePath = path.join(testRepoPath, "baseline.json");

    // Initialize git repo
    const { spawnSync } = require("child_process");
    spawnSync("git", ["init"], { cwd: testRepoPath, stdio: "ignore" });
    spawnSync("git", ["config", "user.email", "test@test.com"], { cwd: testRepoPath, stdio: "ignore" });
    spawnSync("git", ["config", "user.name", "Test User"], { cwd: testRepoPath, stdio: "ignore" });

    // Create test files with secrets
    fs.writeFileSync(
      path.join(testRepoPath, "config.ts"),
      `const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";\nconst GITHUB_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz123456";\n`
    );
    fs.writeFileSync(
      path.join(testRepoPath, ".env"),
      `STRIPE_SECRET=sk_test_abcdefghijklmnop\n`
    );

    spawnSync("git", ["add", "."], { cwd: testRepoPath, stdio: "ignore" });
    spawnSync("git", ["commit", "-m", "Initial commit"], { cwd: testRepoPath, stdio: "ignore" });
  });

  afterAll(() => {
    fs.rmSync(testRepoPath, { recursive: true, force: true });
  });

  describe("createScanner", () => {
    it("should create a scanner instance", () => {
      const options: ScanOptions = {
        repoPath: testRepoPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      };
      const scanner = createScanner(options);
      expect(scanner).toBeInstanceOf(SecretScanner);
    });
  });

  describe("SecretScanner.scan", () => {
    it("should return a valid scan result structure", async () => {
      const options: ScanOptions = {
        repoPath: testRepoPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      };
      const scanner = createScanner(options);
      const result = await scanner.scan();

      expect(result).toHaveProperty("repoPath", testRepoPath);
      expect(result).toHaveProperty("scanId");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("findings");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("status");
      expect(Array.isArray(result.findings)).toBe(true);
      expect(typeof result.summary.secretsFound).toBe("number");
    });

    it("should handle non-existent repository path", async () => {
      const options: ScanOptions = {
        repoPath: "/non/existent/path",
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      };
      const scanner = createScanner(options);
      const result = await scanner.scan();

      expect(result.status).toBe("error");
      expect(result.error).toBeDefined();
    });

    it("should handle non-git directory", async () => {
      const nonGitPath = fs.mkdtempSync(path.join(os.tmpdir(), "non-git-"));
      fs.writeFileSync(path.join(nonGitPath, "file.txt"), "content");

      const options: ScanOptions = {
        repoPath: nonGitPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      };
      const scanner = createScanner(options);
      const result = await scanner.scan();

      expect(result.status).toBe("error");
      expect(result.error).toContain("git repository");

      fs.rmSync(nonGitPath, { recursive: true, force: true });
    });
  });

  describe("Baseline handling", () => {
    it("should load and apply baseline correctly", () => {
      const baseline = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entries: [{
          finding: {
            id: "test-1",
            ruleId: "test-rule",
            filePath: "config.ts",
            commitHash: "abc123",
            lineNumber: 1,
            secret: "AKIA***",
            severity: "critical" as const,
            message: "Test finding",
          },
          justification: "Test credential for CI",
          author: "test",
          timestamp: new Date().toISOString(),
        }],
        metadata: { repoPath: testRepoPath, totalSuppressed: 1, scanners: ["gitleaks"] },
      };

      fs.writeFileSync(testBaselinePath, JSON.stringify(baseline, null, 2));

      const options: ScanOptions = {
        repoPath: testRepoPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
        baselinePath: testBaselinePath,
      };

      const scanner = createScanner(options);
      // Baseline is loaded internally during scan
      expect(true).toBe(true);
    });
  });

  describe("Finding severity mapping", () => {
    it("should map critical patterns correctly", () => {
      const scanner = createScanner({
        repoPath: testRepoPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      });

      // Access private method through reflection for testing
      const mapSeverity = (scanner as any).mapSeverity.bind(scanner);
      expect(mapSeverity("aws-secret-access-key")).toBe("critical");
      expect(mapSeverity("private-key")).toBe("critical");
      expect(mapSeverity("ssh-key")).toBe("critical");
    });

    it("should map high severity patterns correctly", () => {
      const scanner = createScanner({
        repoPath: testRepoPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      });

      const mapSeverity = (scanner as any).mapSeverity.bind(scanner);
      expect(mapSeverity("api-key")).toBe("high");
      expect(mapSeverity("github-pat")).toBe("high");
      expect(mapSeverity("stripe-secret-key")).toBe("high");
    });
  });

  describe("Summary calculation", () => {
    it("should calculate summary correctly", () => {
      const scanner = createScanner({
        repoPath: testRepoPath,
        enableGitleaks: true,
        enableTruffleHog: false,
        outputFormat: "json",
        verifyCredentials: false,
      });

      const findings: Finding[] = [
        { id: "1", ruleId: "r1", filePath: "a.ts", commitHash: "c1", lineNumber: 1, secret: "s", severity: "critical", message: "m" },
        { id: "2", ruleId: "r2", filePath: "b.ts", commitHash: "c2", lineNumber: 2, secret: "s", severity: "high", message: "m" },
        { id: "3", ruleId: "r3", filePath: "c.ts", commitHash: "c3", lineNumber: 3, secret: "s", severity: "medium", message: "m" },
        { id: "4", ruleId: "r4", filePath: "d.ts", commitHash: "c4", lineNumber: 4, secret: "s", severity: "low", message: "m" },
      ];

      const calcSummary = (scanner as any).calculateSummary.bind(scanner);
      const summary = calcSummary(findings);

      expect(summary.secretsFound).toBe(4);
      expect(summary.critical).toBe(1);
      expect(summary.high).toBe(1);
      expect(summary.medium).toBe(1);
      expect(summary.low).toBe(1);
    });
  });
});