// ReportView component - Detailed findings view with export options

import React, { useState } from "react";
import styled from "styled-components";
import { Finding, ScanResult } from "../scanner";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #3c3c3c;
`;

const ReportInfo = styled.div`
  flex: 1;
`;

const ReportTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  color: #ffffff;
`;

const ReportMeta = styled.div`
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #9cdcfe;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ExportButton = styled.button<{ $format: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  background: ${props => {
    switch (props.$format) {
      case "json": return "#0078d4";
      case "csv": return "#107c10";
      case "sarif": return "#8764b8";
      default: return "#3c3c3c";
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div<{ $severity?: string }>`
  background: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  padding: 20px;
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

const SummaryLabel = styled.div`
  font-size: 12px;
  color: #9cdcfe;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #252526;
  border-radius: 6px;
  padding: 4px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: ${props => props.$active ? "#0078d4" : "transparent"};
  color: ${props => props.$active ? "#ffffff" : "#9cdcfe"};
  transition: all 0.15s;

  &:hover:not([disabled]) {
    background: ${props => props.$active ? "#106ebe" : "#3c3c3c"};
  }
`;

const TabPanel = styled.div`
  background: #252526;
  border-radius: 6px;
  overflow: hidden;
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
  font-size: 11px;
  font-weight: 600;
  color: #9cdcfe;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3c3c3c;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #3c3c3c;
  transition: background 0.15s;

  &:hover {
    background: #2d2d2d;
  }
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

const DetailPanel = styled.div`
  padding: 24px;
`;

const DetailSection = styled.div`
  margin-bottom: 24px;
`;

const DetailLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #9cdcfe;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const DetailValue = styled.div`
  font-size: 13px;
  color: #d4d4d4;
  font-family: ${props => props.$code ? "monospace" : "inherit"};
  word-break: break-all;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #3c3c3c;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #d4d4d4;
  transition: all 0.15s;

  &:hover {
    background: #3c3c3c;
    border-color: #0078d4;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 6px 12px;
  background: #3c3c3c;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  color: #d4d4d4;
  font-size: 13px;
  min-width: 140px;
`;

export interface ReportViewProps {
  result: ScanResult;
  onExport: (format: "json" | "csv" | "sarif") => void;
}

export function ReportView({ result, onExport }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<"findings" | "details" | "summary">("findings");
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredFindings = result.findings.filter(f => 
    severityFilter === "all" || f.severity === severityFilter
  );

  const severityCounts = {
    critical: result.findings.filter(f => f.severity === "critical").length,
    high: result.findings.filter(f => f.severity === "high").length,
    medium: result.findings.filter(f => f.severity === "medium").length,
    low: result.findings.filter(f => f.severity === "low").length,
  };

  return (
    <Container>
      <ReportHeader>
        <ReportInfo>
          <ReportTitle>Scan Report</ReportTitle>
          <ReportMeta>
            <MetaItem>📁 Repository: <CodeCell>{result.repoPath}</CodeCell></MetaItem>
            <MetaItem>🕐 Scanned: <CodeCell>{new Date(result.timestamp).toLocaleString()}</CodeCell></MetaItem>
            <MetaItem>🆔 Scan ID: <CodeCell>{result.scanId.slice(-8)}</CodeCell></MetaItem>
            <MetaItem>📊 Status: <span style={{ color: result.status === "completed" ? "#107c10" : "#da3b01" }}>{result.status}</span></MetaItem>
          </ReportMeta>
        </ReportInfo>
        <ExportButtons>
          <ExportButton $format="json" onClick={() => onExport("json")}>📄 JSON</ExportButton>
          <ExportButton $format="csv" onClick={() => onExport("csv")}>📊 CSV</ExportButton>
          <ExportButton $format="sarif" onClick={() => onExport("sarif")}>🔍 SARIF</ExportButton>
        </ExportButtons>
      </ReportHeader>

      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Total Findings</SummaryLabel>
          <SummaryValue>{result.summary.secretsFound}</SummaryValue>
        </SummaryCard>
        <SummaryCard $severity="critical">
          <SummaryLabel>Critical</SummaryLabel>
          <SummaryValue>{severityCounts.critical}</SummaryValue>
        </SummaryCard>
        <SummaryCard $severity="high">
          <SummaryLabel>High</SummaryLabel>
          <SummaryValue>{severityCounts.high}</SummaryValue>
        </SummaryCard>
        <SummaryCard $severity="medium">
          <SummaryLabel>Medium</SummaryLabel>
          <SummaryValue>{severityCounts.medium}</SummaryValue>
        </SummaryCard>
        <SummaryCard $severity="low">
          <SummaryLabel>Low</SummaryLabel>
          <SummaryValue>{severityCounts.low}</SummaryValue>
        </SummaryCard>
      </SummaryGrid>

      <Tabs>
        <Tab $active={activeTab === "findings"} onClick={() => setActiveTab("findings")}>
          Findings ({filteredFindings.length})
        </Tab>
        <Tab $active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>
          Summary
        </Tab>
      </Tabs>

      <TabPanel>
        {activeTab === "findings" && (
          <>
            <FilterBar>
              <FilterSelect
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </FilterSelect>
              <span style={{ color: "#9cdcfe", fontSize: "13px", alignSelf: "center" }}>
                {filteredFindings.length} of {result.findings.length} findings
              </span>
            </FilterBar>

            {filteredFindings.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>
                No findings match the current filter
              </div>
            ) : (
              <FindingsTable>
                <TableHeader>
                  <tr>
                    <TableHeaderCell style={{ width: "80px" }}>Severity</TableHeaderCell>
                    <TableHeaderCell style={{ width: "140px" }}>Rule</TableHeaderCell>
                    <TableHeaderCell>File</TableHeaderCell>
                    <TableHeaderCell style={{ width: "80px" }}>Line</TableHeaderCell>
                    <TableHeaderCell style={{ width: "100px" }}>Verified</TableHeaderCell>
                    <TableHeaderCell style={{ width: "100px" }}>Actions</TableHeaderCell>
                  </tr>
                </TableHeader>
                <tbody>
                  {filteredFindings.map(finding => (
                    <TableRow key={finding.id}>
                      <TableCell><SeverityBadge $severity={finding.severity} /></TableCell>
                      <TableCell><CodeCell>{finding.ruleId}</CodeCell></TableCell>
                      <TableCell><CodeCell>{finding.filePath}</CodeCell></TableCell>
                      <TableCell><CodeCell>{finding.lineNumber}</CodeCell></TableCell>
                      <TableCell>{finding.verified ? <VerifiedBadge>Verified</VerifiedBadge> : "-"}</TableCell>
                      <TableCell>
                        <ActionButton onClick={() => setSelectedFinding(finding)}>
                          Details
                        </ActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </FindingsTable>
            )}
          </>
        )}

        {activeTab === "summary" && (
          <DetailPanel>
            <DetailSection>
              <DetailLabel>Repository</DetailLabel>
              <DetailValue>{result.repoPath}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>Scan Timestamp</DetailLabel>
              <DetailValue>{new Date(result.timestamp).toLocaleString()}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>Scan ID</DetailLabel>
              <DetailValue $code>{result.scanId}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>Total Files Scanned</DetailLabel>
              <DetailValue>{result.summary.totalScanned}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>Critical Findings</DetailLabel>
              <DetailValue style={{ color: "#da3b01", fontWeight: 600 }}>{severityCounts.critical}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>High Severity</DetailLabel>
              <DetailValue style={{ color: "#bf8b00", fontWeight: 600 }}>{severityCounts.high}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>Medium Severity</DetailLabel>
              <DetailValue style={{ color: "#8a6d00", fontWeight: 600 }}>{severityCounts.medium}</DetailValue>
            </DetailSection>
            <DetailSection>
              <DetailLabel>Low Severity</DetailLabel>
              <DetailValue style={{ color: "#107c10", fontWeight: 600 }}>{severityCounts.low}</DetailValue>
            </DetailSection>
          </DetailPanel>
        )}

        {selectedFinding && (
          <DetailPanel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0 }}>Finding Details</h3>
              <ActionButton onClick={() => setSelectedFinding(null)}>Close</ActionButton>
            </div>

            <DetailSection>
              <DetailLabel>Severity</DetailLabel>
              <SeverityBadge $severity={selectedFinding.severity} />
            </DetailSection>

            <DetailSection>
              <DetailLabel>Rule ID</DetailLabel>
              <DetailValue $code>{selectedFinding.ruleId}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailLabel>File Path</DetailLabel>
              <DetailValue $code>{selectedFinding.filePath}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailLabel>Line Number</DetailLabel>
              <DetailValue>{selectedFinding.lineNumber}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailLabel>Commit Hash</DetailLabel>
              <DetailValue $code>{selectedFinding.commitHash}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailLabel>Verified</DetailLabel>
              <DetailValue>{selectedFinding.verified ? "Yes" : "No"}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailLabel>Message</DetailLabel>
              <DetailValue>{selectedFinding.message}</DetailValue>
            </DetailSection>

            {selectedFinding.entropy && (
              <DetailSection>
                <DetailLabel>Entropy</DetailLabel>
                <DetailValue>{selectedFinding.entropy}</DetailValue>
              </DetailSection>
            )}

            <Actions>
              <ActionButton onClick={() => setSelectedFinding(null)}>Close</ActionButton>
              <ActionButton>Add to Baseline</ActionButton>
              <ActionButton>View in Editor</ActionButton>
            </Actions>
          </DetailPanel>
        )}
      </TabPanel>
    </Container>
  );
}