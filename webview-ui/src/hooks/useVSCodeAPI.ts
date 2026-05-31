import type { WebviewMessage } from "../types";

interface VSCodeAPI {
  postMessage(message: WebviewMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let api: VSCodeAPI | null = null;

export function getVSCodeAPI(): VSCodeAPI {
  if (!api) {
    api = acquireVsCodeApi();
  }
  return api;
}

export function postMessage(message: WebviewMessage): void {
  getVSCodeAPI().postMessage(message);
}
