import * as vscode from "vscode";
import { DataPrismPanel } from "../panels/DataPrismPanel";

export function registerReAnalyzeCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("dataprism.reAnalyze", () => {
    const active = DataPrismPanel.getActive();
    if (active) {
      active.sendMessage({ type: "ANALYSIS_PROGRESS", payload: { stage: "metadata", percent: 0 } });
      DataPrismPanel.createOrShow(
        vscode.extensions.getExtension("CODExGAMERZ.dataprism")!.extensionUri,
        active.getFilePath(),
        null
      );
    } else {
      vscode.window.showInformationMessage("DataPrism: No active analysis panel.");
    }
  });
}
