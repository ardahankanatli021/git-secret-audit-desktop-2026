// Electron main process for Git Secret Audit Desktop
// Scans git repositories for exposed secrets, tokens, and credentials

const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Store for application state and scanner results
let mainWindow;
let scannerStore = {
  currentScan: null,
  history: [],
};

// Initialize the application
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    title: "Git Secret Audit Desktop",
    icon: path.join(__dirname, "assets", "icon.png"),
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC handlers for scanner communication
ipcMain.handle("scanner:start", async (event, { repoPath, options }) => {
  try {
    const result = await startScanner(repoPath, options);
    mainWindow.webContents.send("scanner:progress", {
      status: "complete",
      result,
    });
    scannerStore.history.push(result);
    return result;
  } catch (error) {
    mainWindow.webContents.send("scanner:error", error.message);
    throw error;
  }
});

ipcMain.handle("scanner:stop", () => {
  // Request scanner stop
  return { status: "stopped" };
});

ipcMain.handle("scanner:baseline:load", async (event, { baselinePath }) => {
  try {
    if (fs.existsSync(baselinePath)) {
      const content = fs.readFileSync(baselinePath, "utf8");
      return JSON.parse(content);
    }
    return { findings: [], baseline: true };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("scanner:baseline:save", async (event, { baselinePath, data }) => {
  try {
    fs.writeFileSync(baselinePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("scanner:export:sarif", async (event, { findings, outputPath }) => {
  try {
    const sarifContent = generateSARIF(findings);
    fs.writeFileSync(outputPath, sarifContent);
    return { success: true, path: outputPath };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("app:about", () => {
  return {
    name: "Git Secret Audit Desktop",
    version: "1.0.0",
    description: "Desktop utility for scanning git repositories for exposed secrets",
  };
});

// Scanner worker function
async function startScanner(repoPath, options = {}) {
  // Validate repository path
  if (!fs.existsSync(repoPath)) {
    throw new Error("Repository path does not exist");
  }

  // Check for git repository
  const gitDir = path.join(repoPath, ".git");
  if (!fs.existsSync(gitDir)) {
    throw new Error("Not a git repository");
  }

  // In a real implementation, this would integrate with Gitleaks and TruffleHog
  // For now, return structured result
  return {
    repoPath,
    scanId: Date.now().toString(),
    timestamp: new Date().toISOString(),
    findings: [],
    summary: {
      totalScanned: 0,
      secretsFound: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    status: "completed",
  };
}

// Generate SARIF output for CI integration
function generateSARIF(findings) {
  const sarif = {
    "$schema": "https://schemastore.org/schemas/json/sarif.json",
    "version": "2.1.0",
    "runs": [{
      "tool": {
        "driver": {
          "name": "Git Secret Audit",
          "informationUri": "https://github.com/ardahankanatli021/git-secret-audit-desktop-2026",
        }
      },
      "results": findings.map(f => ({
        "level": f.severity,
        "message": {
          "text": f.message,
        },
        "locations": [{
          "physicalLocation": {
            "artifactUri": f.filePath,
            "region": {
              "startLine": f.lineNumber,
            }
          }
        }]
      }))
    }]
  };
  return JSON.stringify(sarif, null, 2);
}