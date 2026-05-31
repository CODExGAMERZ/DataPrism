import * as vscode from "vscode";

interface RecentFileEntry {
  filePath: string;
  fileName: string;
  rows: number;
  qualityScore: number;
  lastAnalyzed: number;
}

export class RecentFilesProvider implements vscode.TreeDataProvider<RecentFileItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RecentFileItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private entries: RecentFileEntry[] = [];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.entries = context.globalState.get<RecentFileEntry[]>("dataprism.recentFiles", []);
  }

  addEntry(filePath: string, fileName: string, rows: number, qualityScore: number): void {
    this.entries = this.entries.filter((e) => e.filePath !== filePath);
    this.entries.unshift({ filePath, fileName, rows, qualityScore, lastAnalyzed: Date.now() });
    if (this.entries.length > 20) this.entries = this.entries.slice(0, 20);
    this.context.globalState.update("dataprism.recentFiles", this.entries);
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: RecentFileItem): vscode.TreeItem {
    return element;
  }

  getChildren(): RecentFileItem[] {
    return this.entries.map((entry) => new RecentFileItem(entry));
  }
}

class RecentFileItem extends vscode.TreeItem {
  constructor(entry: RecentFileEntry) {
    super(entry.fileName, vscode.TreeItemCollapsibleState.None);
    this.description = `${entry.rows.toLocaleString()} rows · ${entry.qualityScore}/100`;
    this.tooltip = `${entry.filePath}\nLast analyzed: ${new Date(entry.lastAnalyzed).toLocaleString()}`;
    this.iconPath = new vscode.ThemeIcon(
      entry.qualityScore >= 80 ? "pass-filled" : entry.qualityScore >= 50 ? "warning" : "error"
    );
    this.command = {
      command: "dataprism.openFile",
      title: "Open with DataPrism",
      arguments: [vscode.Uri.file(entry.filePath)],
    };
    this.contextValue = "recentFile";
  }
}
