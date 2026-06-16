import type { WebviewMessage } from "../types";

interface VSCodeAPI {
  postMessage(message: WebviewMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let api: VSCodeAPI | null = null;
let isVSCode = false;

try {
  if (typeof acquireVsCodeApi === "function") {
    api = acquireVsCodeApi();
    isVSCode = true;
  }
} catch (e) {
  // Not in VS Code environment
}

export function getVSCodeAPI(): VSCodeAPI | null {
  return api;
}

export function isVSCodeEnv(): boolean {
  return isVSCode;
}

export function postMessage(message: WebviewMessage): void {
  if (api) {
    api.postMessage(message);
  } else {
    console.log("Mock postMessage inside browser:", message);
  }
}
