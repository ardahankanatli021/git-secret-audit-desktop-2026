// ScanView component - Shows scan progress and real-time results

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Finding, ScanResult } from "../scanner";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ProgressSection = styled.div`
  background: #252526;
  border-radius: 6px;
  padding: 24px;
  margin-bottom: 16px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProgressTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #ffffff;
`;

const ProgressBarContainer = styled.div`
  height: 8px;
  background: #3c3c3c;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: #0078d4;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #9cdcfe;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.span`
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
`;

const StatValue = styled.span`
  font-weight: 600;
  color: #ffffff;
`;

const CurrentFile = styled.div`
  font-size: 12px;
  color: #9cdcfe;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FindingsSection = styled.div`
  flex: 1;
  background: #252526;
  border-radius: 6px;
  overflow: hidden;
`;

const FindingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #3c3c3c;
`;

const FindingsTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #ffffff;
`;

const FindingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #2d2d2d;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #9cdcfe;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3c3c3c;
`;

const TableRow = styled.tr<{ $severity?: string }>`
  border-bottom: 1px solid #3c3c3c;
  transition: background 0.15s;

  &:hover {
    background: #2d2d2d;
  }

  ${props => props.$severity === "critical" && `
    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #da3b01;
    }
  `}
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 13px;
  color: #d4d4d4;
  vertical-align: middle;
`;

const SeverityBadge = styled.span<{ $severity: string }>`
  display: inline-block;
  padding: 2px 8px;
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

const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  background: #107c10;
  color: white;
`;

const CodeCell = styled.code`
  font-family: monospace;
  font-size: 12px;
  color: #9cdcfe;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #888;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

export interface ScanViewProps {
  repoPath: string;
  onComplete?: () => void;
}

export function ScanView({ repoPath }: ScanViewProps) {
  const [progress, setProgress] = useState(0);
  const [scanned, setScanned] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [status, setStatus] = useState<"running" | "completed" | "error">("running");

  useEffect(() => {
    // Simulate scanning progress
    const totalFiles = 150;
    setTotal(totalFiles);
    let scannedCount = 0;
    let progressValue = 0;
    const mockFindings: Finding[] = [];

    const interval = setInterval(() => {
      scannedCount += Math.floor(Math.random() * 5) + 1;
      if (scannedCount > totalFiles) scannedCount = totalFiles;
      progressValue = Math.round((scannedCount / totalFiles) * 100);

      setScanned(scannedCount);
      setProgress(progressValue);
      setCurrentFile(`src/components/${Math.random().toString(36).substring(7)}.ts`);

      // Randomly add findings
      if (Math.random() < 0.1 && mockFindings.length < 5) {
        const severities: Finding["severity"][] = ["critical", "high", "medium", "low"];
        const rules = ["aws-access-key-id", "github-pat", "stripe-secret-key", "generic-api-key"];
        mockFindings.push({
          id: `f${mockFindings.length + 1}`,
          ruleId: rules[Math.floor(Math.random() * rules.length)],
          filePath: `src/${Math.random().toString(36).substring(7)}.ts`,
          commitHash: Math.random().toString(36).substring(7),
          lineNumber: Math.floor(Math.random() * 200) + 1,
          secret: "***",
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: "Secret detected",
        });
        setFindings([...mockFindings]);
      }

      if (progressValue >= 100) {
        clearInterval(interval);
        setStatus("completed");
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <ProgressSection>
        <ProgressHeader>
          <ProgressTitle>Scanning: {repoPath}</ProgressTitle>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0078d4" }}>{progress}%</span>
        </ProgressHeader>
        <ProgressBarContainer>
          <ProgressBar $progress={progress} />
        </ProgressBarContainer>
        <ProgressStats>
          <Stat>
            <StatLabel>Files Scanned</StatLabel>
            <StatValue>{scanned} / {total}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Findings</StatLabel>
            <StatValue>{findings.length}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Status</StatLabel>
            <StatValue>{status === "running" ? "Scanning..." : "Complete"}</StatValue>
          </Stat>
        </ProgressStats>
        <CurrentFile>Current: {currentFile}</CurrentFile>
      </ProgressSection>

      <FindingsSection>
        <FindingsHeader>
          <FindingsTitle>Live Findings ({findings.length})</FindingsTitle>
          {status === "completed" && (
            <span style={{ fontSize: "12px", color: "#107c10", fontWeight: 500 }}>
              Scan complete
            </span>
          )}
        </FindingsHeader>

        {findings.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <div>Scanning for secrets...</div>
            <div style={{ fontSize: "12px", marginTop: "8px" }}>
              {status === "completed" ? "No secrets found!" : "Results appear here in real-time"}
            </div>
          </EmptyState>
        ) : (
          <FindingsTable>
            <TableHeader>
              <tr>
                <TableHeaderCell style={{ width: "80px" }}>Severity</TableHeaderCell>
                <TableHeaderCell style={{ width: "120px" }}>Rule</TableHeaderCell>
                <TableHeaderCell>File</TableHeaderCell>
                <TableHeaderCell style={{ width: "80px" }}>Line</TableHeaderCell>
                <TableHeaderCell style={{ width: "100px" }}>Verified</TableHeaderCell>
              </tr>
            </TableHeader>
            <tbody>
              {findings.map(finding => (
                <TableRow key={finding.id} $severity={finding.severity}>
                  <TableCell><SeverityBadge $severity={finding.severity} /></TableCell>
                  <TableCell><CodeCell>{finding.ruleId}</CodeCell></TableCell>
                  <TableCell><CodeCell>{finding.filePath}</CodeCell></TableCell>
                  <TableCell><CodeCell>{finding.lineNumber}</CodeCell></TableCell>
                  <TableCell>{finding.verified ? <VerifiedBadge>Verified</VerifiedBadge> : "-"}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </FindingsTable>
        )}
      </FindingsSection>
    </Container>
  );
}