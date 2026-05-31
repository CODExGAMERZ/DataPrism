import * as vscode from "vscode";
import * as path from "path";
import type { HostMessage, WebviewMessage } from "../types/messages";
import type { DatasetProfile } from "../types/dataset";
import { analyzeFile } from "../analysis/analyzer";
import { generateHtmlReport } from "../report/htmlReport";
import { generateMarkdownReport } from "../report/markdownReport";
import { RecentFilesProvider } from "../sidebar/RecentFilesProvider";

export class DataPrismPanel {
  private static panels = new Map<string, DataPrismPanel>();
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly filePath: string;
  private currentProfile: DatasetProfile | null = null;
  private disposed = false;
  private recentFiles: RecentFilesProvider | null = null;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    filePath: string,
    recentFiles: RecentFilesProvider | null
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.filePath = filePath;
    this.recentFiles = recentFiles;

    this.panel.webview.html = this.getWebviewContent();
    this.panel.onDidDispose(() => this.dispose());

    this.panel.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      switch (msg.type) {
        case "WEBVIEW_READY":
          this.runAnalysis();
          break;
        case "RE_ANALYZE":
          this.runAnalysis();
          break;
        case "EXPORT_REPORT":
          this.exportReport(msg.payload.format);
          break;
        case "OPEN_FILE":
          vscode.commands.executeCommand("dataprism.openFile");
          break;
      }
    });
  }

  static createOrShow(
    extensionUri: vscode.Uri,
    filePath: string,
    recentFiles: RecentFilesProvider | null
  ): DataPrismPanel {
    const existing = DataPrismPanel.panels.get(filePath);
    if (existing && !existing.disposed) {
      existing.panel.reveal(vscode.ViewColumn.One);
      return existing;
    }

    const fileName = path.basename(filePath);
    const panel = vscode.window.createWebviewPanel(
      "dataprism",
      `DataPrism: ${fileName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "webview-ui", "dist")],
      }
    );

    panel.iconPath = new vscode.ThemeIcon("graph");

    const instance = new DataPrismPanel(panel, extensionUri, filePath, recentFiles);
    DataPrismPanel.panels.set(filePath, instance);
    return instance;
  }

  static getActive(): DataPrismPanel | undefined {
    for (const panel of DataPrismPanel.panels.values()) {
      if (panel.panel.active && !panel.disposed) return panel;
    }
    return undefined;
  }

  getProfile(): DatasetProfile | null {
    return this.currentProfile;
  }

  getFilePath(): string {
    return this.filePath;
  }

  sendMessage(msg: HostMessage): void {
    if (!this.disposed) {
      this.panel.webview.postMessage(msg);
    }
  }

  switchTab(tab: string): void {
    this.sendMessage({ type: "ANALYSIS_PROGRESS", payload: { stage: "complete", percent: 100 } });
  }

  private async runAnalysis(): Promise<void> {
    this.currentProfile = null;

    await analyzeFile(this.filePath, {
      onProgress: (stage, percent) => {
        this.sendMessage({ type: "ANALYSIS_PROGRESS", payload: { stage, percent } });
      },
      onMetadata: (metadata) => {
        this.sendMessage({ type: "FILE_METADATA", payload: metadata });
      },
      onPreview: (preview) => {
        this.sendMessage({ type: "PREVIEW_DATA", payload: preview });
      },
      onColumns: (columns) => {
        this.sendMessage({ type: "COLUMN_PROFILES", payload: columns });
      },
      onMissing: (missing) => {
        this.sendMessage({ type: "MISSING_DATA", payload: missing });
      },
      onDuplicates: (duplicates) => {
        this.sendMessage({ type: "DUPLICATE_DATA", payload: duplicates });
      },
      onCorrelation: (correlation) => {
        this.sendMessage({ type: "CORRELATION_DATA", payload: correlation });
      },
      onOutliers: (outliers) => {
        this.sendMessage({ type: "OUTLIER_DATA", payload: outliers });
      },
      onQuality: (quality) => {
        this.sendMessage({ type: "QUALITY_DATA", payload: quality });
      },
      onComplete: (profile) => {
        this.currentProfile = profile;
        this.sendMessage({ type: "ANALYSIS_COMPLETE", payload: profile });
        if (this.recentFiles) {
          this.recentFiles.addEntry(
            this.filePath,
            profile.metadata.fileName,
            profile.metadata.rows,
            profile.quality.score
          );
        }
      },
      onError: (stage, message) => {
        this.sendMessage({ type: "ANALYSIS_ERROR", payload: { stage, message } });
      },
    });
  }

  private async exportReport(format: "html" | "markdown"): Promise<void> {
    if (!this.currentProfile) {
      vscode.window.showWarningMessage("DataPrism: Analysis not complete. Please wait for analysis to finish.");
      return;
    }

    const config = vscode.workspace.getConfiguration("dataprism");
    const exportPath = config.get<string>("exportPath", "");
    const defaultDir = exportPath || path.dirname(this.filePath);
    const baseName = path.basename(this.filePath, path.extname(this.filePath));
    const ext = format === "html" ? "html" : "md";

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(defaultDir, `${baseName}_report.${ext}`)),
      filters: format === "html" ? { "HTML Files": ["html"] } : { "Markdown Files": ["md"] },
    });

    if (!uri) return;

    const content = format === "html" ? generateHtmlReport(this.currentProfile) : generateMarkdownReport(this.currentProfile);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
    vscode.window.showInformationMessage(`DataPrism: Report saved to ${uri.fsPath}`);
  }

  private getWebviewContent(): string {
    const webview = this.panel.webview;
    const distUri = vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist");

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "assets", "index.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "assets", "index.css"));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>DataPrism</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private dispose(): void {
    this.disposed = true;
    DataPrismPanel.panels.delete(this.filePath);
    this.panel.dispose();
  }
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
