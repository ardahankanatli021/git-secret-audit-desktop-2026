// Dashboard component - Main UI for Git Secret Audit Desktop

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ScanView } from "./ScanView";
import { ReportView } from "./ReportView";

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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Segoe UI', system-ui, sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  background: ${props => props.$primary ? "#0078d4" : props.$danger ? "#da3b01" : "#3c3c3c"};
  color: ${props => props.$primary || props.$danger ? "#ffffff" : "#d4d4d4"};

  &:hover:not(:disabled) {
    background: ${props => props.$primary ? "#106ebe" : props.$danger ? "#c42b01" : "#4a4a4a"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Main = styled.main`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 280px;
  background: #252526;
  border-right: 1px solid #3c3c3c;
  display: flex;
  flex-direction: column;
`;

const SidebarSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid #3c3c3c;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9cdcfe;
`;

const RepoInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  background: #3c3c3c;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  color: #d4d4d4;
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #0078d4;
  }
`;

const ScanButton = styled(Button)`
  width: 100%;
  margin-top: 8px;
`;

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
`;

const HistoryItem = styled.li`
  padding: 12px;
  border-bottom: 1px solid #3c3c3c;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #2d2d2d;
  }
`;

const HistoryItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
`;

const HistoryItemMeta = styled.div`
  font-size: 11px;
  color: #888;
`;

const SeverityBadge = styled.span<{ $severity: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.$severity) {
      case "critical": return "#da3b01";
      case "high": return "#bf8b00";
      case "medium": return "#8a6d00";
      case "low": return "#107c10";
      default: return "#3c3c3c";
    }
  }};
  color: white;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div<{ $severity?: string }>`
  background: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  padding: 16px;
  border-left: 4px solid ${props => {
    switch (props.$severity) {
      case "critical": return "#da3b01";
      case "high": return "#bf8b00";
      case "medium": return "#8a6d00";
      case "low": return "#107c10";
      default: return "#0078d4";
    }
  }};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #9cdcfe;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 24px;
  background: #0078d4;
  color: white;
  font-size: 12px;
`;

export function Dashboard() {
  const [activeView, setActiveView] = useState<"scan" | "report" | "dashboard">("dashboard");
  const [repoPath, setRepoPath] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    if (!repoPath.trim()) return;
    setIsScanning(true);
    setActiveView("scan");

    // Simulate scan - in real app, this would call IPC to main process
    setTimeout(() => {
      const mockResult: ScanResult = {
        repoPath,
        scanId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        findings: [
          {
            id: "1",
            ruleId: "aws-access-key-id",
            filePath: "src/config.ts",
            commitHash: "abc1234",
            lineNumber: 42,
            secret: "AKIA***",
            severity: "critical",
            message: "AWS Access Key ID detected in config file",
          },
          {
            id: "2",
            ruleId: "github-pat",
            filePath: ".env",
            commitHash: "def5678",
            lineNumber: 3,
            secret: "ghp_***",
            severity: "high",
            verified: true,
            message: "GitHub Personal Access Token detected",
          },
        ],
        summary: { totalScanned: 150, secretsFound: 2, critical: 1, high: 1, medium: 0, low: 0 },
        status: "completed",
      };
      setScanResult(mockResult);
      setScanHistory(prev => [mockResult, ...prev]);
      setIsScanning(false);
      setActiveView("report");
    }, 2000);
  };

  const handleExport = (format: "json" | "csv" | "sarif") => {
    if (!scanResult) return;
    // In real app, this would call IPC to main process
    console.log(`Exporting as ${format}:`, scanResult);
  };

  return (
    <Container>
      <Header>
        <Title>Git Secret Audit Desktop</Title>
        <Actions>
          <Button onClick={() => setActiveView("dashboard")}>Dashboard</Button>
          <Button onClick={() => setActiveView("scan")}>New Scan</Button>
        </Actions>
      </Header>

      <Main>
        <Sidebar>
          <SidebarSection>
            <SectionTitle>Repository</SectionTitle>
            <RepoInput
              type="text"
              value={repoPath}
              onChange={e => setRepoPath(e.target.value)}
              placeholder="Enter repository path or GitHub URL"
            />
            <ScanButton $primary onClick={handleScan} disabled={isScanning || !repoPath.trim()}>
              {isScanning ? "Scanning..." : "Start Scan"}
            </ScanButton>
          </SidebarSection>

          <SidebarSection>
            <SectionTitle>Recent Scans</SectionTitle>
            <HistoryList>
              {scanHistory.map((scan, index) => (
                <HistoryItem key={scan.scanId} onClick={() => { setScanResult(scan); setActiveView("report"); }}>
                  <HistoryItemHeader>
                    <span>{new Date(scan.timestamp).toLocaleString()}</span>
                    <SeverityBadge $severity={scan.summary.critical > 0 ? "critical" : scan.summary.high > 0 ? "high" : "medium"}>
                      {scan.summary.secretsFound} found
                    </SeverityBadge>
                  </HistoryItemHeader>
                  <HistoryItemMeta>{scan.repoPath}</HistoryItemMeta>
                </HistoryItem>
              ))}
              {scanHistory.length === 0 && (
                <li style={{ padding: "16px", color: "#888", fontSize: "13px", textAlign: "center" }}>
                  No scans yet
                </li>
              )}
            </HistoryList>
          </SidebarSection>
        </Sidebar>

        <Content>
          {activeView === "dashboard" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Welcome to Git Secret Audit Desktop</h2>
              <p style={{ color: "#9cdcfe", maxWidth: "600px" }}>
                Scan your git repositories for exposed secrets, tokens, and credentials across the full commit history.
                Supports Gitleaks and TruffleHog scanners with visual reporting and baseline management.
              </p>

              <StatsGrid>
                <StatCard>
                  <StatLabel>Total Scans</StatLabel>
                  <StatValue>{scanHistory.length}</StatValue>
                </StatCard>
                <StatCard $severity="critical">
                  <StatLabel>Critical Findings</StatLabel>
                  <StatValue>{scanHistory.reduce((sum, s) => sum + s.summary.critical, 0)}</StatValue>
                </StatCard>
                <StatCard $severity="high">
                  <StatLabel>High Severity</StatLabel>
                  <StatValue>{scanHistory.reduce((sum, s) => sum + s.summary.high, 0)}</StatValue>
                </StatCard>
                <StatCard $severity="medium">
                  <StatLabel>Medium Severity</StatLabel>
                  <StatValue>{scanHistory.reduce((sum, s) => sum + s.summary.medium, 0)}</StatValue>
                </StatCard>
              </StatsGrid>

              <h3>Quick Start</h3>
              <ol style={{ lineHeight: "1.8", color: "#d4d4d4" }}>
                <li>Enter a local repository path or GitHub URL in the sidebar</li>
                <li>Click <strong>Start Scan</strong> to begin analysis</li>
                <li>Review findings in the <strong>Report</strong> view</li>
                <li>Export results as JSON, CSV, or SARIF for CI integration</li>
              </ol>
            </div>
          )}

          {activeView === "scan" && <ScanView repoPath={repoPath} onComplete={handleScan} />}
          {activeView === "report" && scanResult && (
            <ReportView result={scanResult} onExport={handleExport} />
          )}
        </Content>
      </Main>

      <StatusBar>
        <span>Git Secret Audit Desktop v1.0.0</span>
        <span>Ready</span>
      </StatusBar>
    </Container>
  );
}