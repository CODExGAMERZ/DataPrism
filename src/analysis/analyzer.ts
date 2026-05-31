import * as vscode from "vscode";
import * as fs from "fs";
import type { DatasetProfile, ColumnProfile, MissingValueSummary, DuplicateSummary, CorrelationMatrix, OutlierResult, QualityScore, FileMetadata, PreviewData } from "../types/dataset";
import type { AnalysisStage } from "../types/messages";
import { parseFile, buildMetadata, buildPreview, detectFileType } from "./fileParser";
import { profileColumns } from "./columnProfiler";
import { analyzeMissingValues } from "./missingValues";
import { analyzeDuplicates } from "./duplicates";
import { computeCorrelation } from "./correlation";
import { detectOutliers } from "./outliers";
import { computeQualityScore } from "./qualityScore";

export interface AnalysisCallbacks {
  onProgress: (stage: AnalysisStage, percent: number) => void;
  onMetadata: (metadata: FileMetadata) => void;
  onPreview: (preview: PreviewData) => void;
  onColumns: (columns: ColumnProfile[]) => void;
  onMissing: (missing: MissingValueSummary) => void;
  onDuplicates: (duplicates: DuplicateSummary) => void;
  onCorrelation: (correlation: CorrelationMatrix | null) => void;
  onOutliers: (outliers: OutlierResult[]) => void;
  onQuality: (quality: QualityScore) => void;
  onComplete: (profile: DatasetProfile) => void;
  onError: (stage: AnalysisStage, message: string) => void;
}

export async function analyzeFile(filePath: string, callbacks: AnalysisCallbacks): Promise<void> {
  const config = vscode.workspace.getConfiguration("datalens");
  const thresholdMB = config.get<number>("largeFileThresholdMB", 50);
  const sampleSize = config.get<number>("sampleSizeRows", 100000);
  const correlationMethod = config.get<"pearson" | "spearman">("correlationMethod", "pearson");

  const fileType = detectFileType(filePath);
  if (!fileType) {
    callbacks.onError("metadata", `Unsupported file type: ${filePath}`);
    return;
  }

  if (!fs.existsSync(filePath)) {
    callbacks.onError("metadata", `File not found: ${filePath}`);
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    callbacks.onError("metadata", "This file contains no data.");
    return;
  }

  const fileSizeMB = stat.size / (1024 * 1024);
  const needsSampling = fileSizeMB > thresholdMB;

  callbacks.onProgress("metadata", 5);

  let parsed;
  try {
    parsed = parseFile(filePath, needsSampling ? sampleSize : undefined);
  } catch (e) {
    callbacks.onError("metadata", `Failed to parse file: ${(e as Error).message}`);
    return;
  }

  if (parsed.rows.length === 0 && parsed.headers.length === 0) {
    callbacks.onError("metadata", "This file contains no data.");
    return;
  }

  const metadata = buildMetadata(filePath, parsed);
  callbacks.onMetadata(metadata);
  callbacks.onProgress("preview", 15);

  const preview = buildPreview(parsed);
  callbacks.onPreview(preview);
  callbacks.onProgress("columns", 25);

  await yieldThread();

  let columns: ColumnProfile[];
  try {
    columns = profileColumns(parsed.headers, parsed.rows);
    callbacks.onColumns(columns);
  } catch (e) {
    callbacks.onError("columns", `Column profiling failed: ${(e as Error).message}`);
    return;
  }
  callbacks.onProgress("missing", 40);

  await yieldThread();

  const missing = analyzeMissingValues(parsed.headers, parsed.rows);
  callbacks.onMissing(missing);
  callbacks.onProgress("duplicates", 50);

  await yieldThread();

  const duplicates = analyzeDuplicates(parsed.rows);
  callbacks.onDuplicates(duplicates);
  callbacks.onProgress("correlation", 60);

  await yieldThread();

  let correlation: CorrelationMatrix | null = null;
  try {
    correlation = computeCorrelation(parsed.headers, parsed.rows, correlationMethod);
    callbacks.onCorrelation(correlation);
  } catch (e) {
    callbacks.onError("correlation", `Correlation computation failed: ${(e as Error).message}`);
  }
  callbacks.onProgress("outliers", 75);

  await yieldThread();

  let outliers: OutlierResult[] = [];
  try {
    outliers = detectOutliers(parsed.headers, parsed.rows);
    callbacks.onOutliers(outliers);
  } catch (e) {
    callbacks.onError("outliers", `Outlier detection failed: ${(e as Error).message}`);
  }
  callbacks.onProgress("quality", 90);

  await yieldThread();

  const quality = computeQualityScore(missing, duplicates, outliers, columns, parsed.rows);
  callbacks.onQuality(quality);
  callbacks.onProgress("complete", 100);

  const profile: DatasetProfile = {
    metadata,
    preview,
    columns,
    missing,
    duplicates,
    correlation,
    outliers,
    quality,
  };

  callbacks.onComplete(profile);
}

function yieldThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
