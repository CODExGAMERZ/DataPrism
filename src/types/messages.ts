import type {
  FileMetadata,
  PreviewData,
  DatasetProfile,
  ColumnProfile,
  MissingValueSummary,
  CorrelationMatrix,
  OutlierResult,
  QualityScore,
  DuplicateSummary,
} from "./dataset";

export type TabName = "preview" | "summary" | "correlations" | "quality" | "columns" | "insights";

export type AnalysisStage =
  | "metadata"
  | "preview"
  | "columns"
  | "missing"
  | "duplicates"
  | "correlation"
  | "outliers"
  | "quality"
  | "complete";

export type HostMessage =
  | { type: "FILE_METADATA"; payload: FileMetadata }
  | { type: "PREVIEW_DATA"; payload: PreviewData }
  | { type: "COLUMN_PROFILES"; payload: ColumnProfile[] }
  | { type: "MISSING_DATA"; payload: MissingValueSummary }
  | { type: "DUPLICATE_DATA"; payload: DuplicateSummary }
  | { type: "CORRELATION_DATA"; payload: CorrelationMatrix | null }
  | { type: "OUTLIER_DATA"; payload: OutlierResult[] }
  | { type: "QUALITY_DATA"; payload: QualityScore }
  | { type: "ANALYSIS_COMPLETE"; payload: DatasetProfile }
  | { type: "ANALYSIS_ERROR"; payload: { stage: AnalysisStage; message: string } }
  | { type: "ANALYSIS_PROGRESS"; payload: { stage: AnalysisStage; percent: number } };

export type WebviewMessage =
  | { type: "EXPORT_REPORT"; payload: { format: "html" | "markdown" } }
  | { type: "RE_ANALYZE" }
  | { type: "OPEN_FILE" }
  | { type: "SWITCH_TAB"; payload: { tab: TabName } }
  | { type: "WEBVIEW_READY" };
