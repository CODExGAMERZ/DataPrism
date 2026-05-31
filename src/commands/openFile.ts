import * as vscode from "vscode";
import { DataPrismPanel } from "../panels/DataPrismPanel";
import { RecentFilesProvider } from "../sidebar/RecentFilesProvider";
import { isSupportedFile } from "../utils/fileUtils";

export function registerOpenFileCommand(
  context: vscode.ExtensionContext,
  recentFiles: RecentFilesProvider
): vscode.Disposable {
  return vscode.commands.registerCommand("dataprism.openFile", async (uri?: vscode.Uri) => {
    let fileUri = uri;

    if (!fileUri) {
      const editor = vscode.window.activeTextEditor;
      if (editor && isSupportedFile(editor.document.uri.fsPath)) {
        fileUri = editor.document.uri;
      }
    }

    if (!fileUri) {
      const picked = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: { "Data Files": ["csv", "json"] },
        title: "Select a dataset file",
      });

      if (!picked || picked.length === 0) return;
      fileUri = picked[0];
    }

    if (!isSupportedFile(fileUri.fsPath)) {
      vscode.window.showErrorMessage("DataPrism: Unsupported file type. Supported formats: CSV, JSON.");
      return;
    }

    DataPrismPanel.createOrShow(context.extensionUri, fileUri.fsPath, recentFiles);
    vscode.commands.executeCommand("setContext", "dataprism.panelActive", true);
  });
}
