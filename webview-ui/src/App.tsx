import { useState, useEffect, useCallback } from "react";
import { postMessage } from "./hooks/useVSCodeAPI";
import type {
  TabName,
  HostMessage,
  FileMetadata,
  PreviewData,
  ColumnProfile,
  MissingValueSummary,
  DuplicateSummary,
  CorrelationMatrix,
  OutlierResult,
  QualityScore,
  DatasetProfile,
} from "./types";
import TabBar from "./components/TabBar";
import ProgressBar from "./components/ProgressBar";
import DataTable from "./components/preview/DataTable";
import OverviewCards from "./components/summary/OverviewCards";
import StatsTable from "./components/summary/StatsTable";
import MissingValuesChart from "./components/summary/MissingValuesChart";
import CorrelationHeatmap from "./components/correlations/CorrelationHeatmap";
import QualityScoreView from "./components/quality/QualityScore";
import OutlierSummary from "./components/quality/OutlierSummary";
import ColumnInsightCard from "./components/columns/ColumnInsightCard";
import ErrorCard from "./components/ErrorCard";
import SkeletonCard from "./components/SkeletonCard";
import InsightsView from "./components/insights/InsightsView";

export default function App() {
  const [tab, setTab] = useState<TabName>("preview");
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<{ stage: string; message: string } | null>(null);

  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [columns, setColumns] = useState<ColumnProfile[] | null>(null);
  const [missing, setMissing] = useState<MissingValueSummary | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateSummary | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationMatrix | null | undefined>(undefined);
  const [outliers, setOutliers] = useState<OutlierResult[] | null>(null);
  const [quality, setQuality] = useState<QualityScore | null>(null);
  const [insights, setInsights] = useState<Required<DatasetProfile>["insights"] | null>(null);

  const handleMessage = useCallback((event: MessageEvent<HostMessage>) => {
    const msg = event.data;
    switch (msg.type) {
      case "FILE_METADATA":
        setMetadata(msg.payload);
        setError(null);
        break;
      case "PREVIEW_DATA":
        setPreview(msg.payload);
        break;
      case "COLUMN_PROFILES":
        setColumns(msg.payload);
        break;
      case "MISSING_DATA":
        setMissing(msg.payload);
        break;
      case "DUPLICATE_DATA":
        setDuplicates(msg.payload);
        break;
      case "CORRELATION_DATA":
        setCorrelation(msg.payload);
        break;
      case "OUTLIER_DATA":
        setOutliers(msg.payload);
        break;
      case "QUALITY_DATA":
        setQuality(msg.payload);
        break;
      case "ANALYSIS_PROGRESS":
        setProgress(msg.payload.percent);
        if (msg.payload.stage === "complete") setComplete(true);
        break;
      case "ANALYSIS_COMPLETE":
        setComplete(true);
        setProgress(100);
        if (msg.payload.insights) {
          setInsights(msg.payload.insights);
        }
        break;
      case "ANALYSIS_ERROR":
        setError(msg.payload);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    postMessage({ type: "WEBVIEW_READY" });
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleReAnalyze = () => {
    setProgress(0);
    setComplete(false);
    setError(null);
    setMetadata(null);
    setPreview(null);
    setColumns(null);
    setMissing(null);
    setDuplicates(null);
    setCorrelation(undefined);
    setOutliers(null);
    setQuality(null);
    setInsights(null);
    postMessage({ type: "RE_ANALYZE" });
  };

  const handleExport = () => {
    postMessage({ type: "EXPORT_REPORT", payload: { format: "html" } });
  };

  if (error && !metadata) {
    return (
      <div className="app">
        <div className="tab-content">
          <ErrorCard message={error.message} onRetry={handleReAnalyze} />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ProgressBar percent={progress} complete={complete} />
      <TabBar active={tab} onChange={setTab} />

      <div className="tab-content">
        {tab === "preview" && (
          <div className="fade-in">
            {metadata?.sampled && (
              <div className="notice">
                ⚡ <strong>Sampled</strong> — Showing {metadata.sampledRows?.toLocaleString()} of {metadata.rows.toLocaleString()} rows
              </div>
            )}
            {metadata?.flatteningApplied && (
              <div className="notice">
                📦 Nested JSON was flattened one level deep. Deeper nesting is serialized as strings.
              </div>
            )}
            {preview ? <DataTable data={preview} /> : <SkeletonCard count={5} />}
          </div>
        )}

        {tab === "summary" && (
          <div className="fade-in">
            {metadata && duplicates ? (
              <OverviewCards metadata={metadata} missing={missing} duplicates={duplicates} />
            ) : (
              <SkeletonCard count={3} />
            )}
            {columns ? <StatsTable columns={columns} /> : <SkeletonCard count={2} />}
            {missing ? <MissingValuesChart missing={missing} /> : <SkeletonCard count={1} />}
          </div>
        )}

        {tab === "insights" && (
          <div className="fade-in">
            <InsightsView insights={insights} />
          </div>
        )}

        {tab === "correlations" && (
          <div className="fade-in">
            {correlation === undefined ? (
              <SkeletonCard count={1} />
            ) : correlation === null ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>Not enough numeric columns for correlation analysis.</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>At least 2 numeric columns are required.</p>
              </div>
            ) : (
              <CorrelationHeatmap data={correlation} />
            )}
          </div>
        )}

        {tab === "quality" && (
          <div className="fade-in">
            {quality ? <QualityScoreView quality={quality} /> : <SkeletonCard count={2} />}
            {outliers ? <OutlierSummary outliers={outliers} /> : <SkeletonCard count={1} />}
          </div>
        )}

        {tab === "columns" && (
          <div className="fade-in">
            {columns ? (
              columns.map((col) => <ColumnInsightCard key={col.info.name} column={col} />)
            ) : (
              <SkeletonCard count={4} />
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12 }}>
            <ErrorCard message={error.message} stage={error.stage} onRetry={handleReAnalyze} />
          </div>
        )}
      </div>

      <div className="status-bar">
        <span>
          {metadata
            ? `${metadata.fileName} · ${metadata.rows.toLocaleString()} rows × ${metadata.cols} cols`
            : "Loading..."}
          {complete && quality ? ` · Quality: ${quality.score}/100` : ""}
        </span>
        <div className="actions">
          <button onClick={handleReAnalyze}>↻ Re-analyze</button>
          <button onClick={handleExport} disabled={!complete}>⬇ Export</button>
        </div>
      </div>
    </div>
  );
}
