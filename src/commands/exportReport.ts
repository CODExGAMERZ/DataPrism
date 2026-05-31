import * as vscode from "vscode";
import { DataPrismPanel } from "../panels/DataPrismPanel";
import { generateHtmlReport } from "../report/htmlReport";
import { generateMarkdownReport } from "../report/markdownReport";
import * as path from "path";

export function registerExportCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("dataprism.exportReport", async () => {
    const active = DataPrismPanel.getActive();
    if (!active) {
      vscode.window.showInformationMessage("DataPrism: No active analysis panel.");
      return;
    }

    const profile = active.getProfile();
    if (!profile) {
      vscode.window.showWarningMessage("DataPrism: Analysis not complete yet.");
      return;
    }

    const config = vscode.workspace.getConfiguration("dataprism");
    const format = config.get<string>("defaultExportFormat", "html");
    const exportPath = config.get<string>("exportPath", "");
    const defaultDir = exportPath || path.dirname(active.getFilePath());
    const baseName = path.basename(active.getFilePath(), path.extname(active.getFilePath()));

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(defaultDir, `${baseName}_report.${format === "html" ? "html" : "md"}`)),
      filters: format === "html" ? { "HTML Files": ["html"] } : { "Markdown Files": ["md"] },
    });

    if (!uri) return;

    const content = format === "html" ? generateHtmlReport(profile) : generateMarkdownReport(profile);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
    vscode.window.showInformationMessage(`DataPrism: Report saved to ${uri.fsPath}`);
  });
}
