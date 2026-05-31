import * as vscode from "vscode";
import { registerOpenFileCommand } from "./commands/openFile";
import { registerReAnalyzeCommand } from "./commands/reAnalyze";
import { registerExportCommand } from "./commands/exportReport";
import { RecentFilesProvider } from "./sidebar/RecentFilesProvider";
import { DataPrismPanel } from "./panels/DataPrismPanel";

export function activate(context: vscode.ExtensionContext): void {
  const recentFiles = new RecentFilesProvider(context);

  const treeView = vscode.window.createTreeView("dataprism-recent-files", {
    treeDataProvider: recentFiles,
    showCollapseAll: false,
  });

  context.subscriptions.push(
    treeView,
    registerOpenFileCommand(context, recentFiles),
    registerReAnalyzeCommand(),
    registerExportCommand(),
    vscode.commands.registerCommand("dataprism.focusPreview", () => {
      DataPrismPanel.getActive()?.sendMessage({
        type: "ANALYSIS_PROGRESS",
        payload: { stage: "complete", percent: 100 },
      });
    }),
    vscode.commands.registerCommand("dataprism.focusSummary", () => {
      DataPrismPanel.getActive()?.sendMessage({
        type: "ANALYSIS_PROGRESS",
        payload: { stage: "complete", percent: 100 },
      });
    })
  );
}

export function deactivate(): void {}
