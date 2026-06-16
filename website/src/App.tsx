import { useState, useEffect, useCallback } from "react";
import { postMessage, isVSCodeEnv } from "./hooks/useVSCodeAPI";
import { analyzeFileInBrowser } from "./analysis/analyzer";
import { generateHtmlReport } from "./report/htmlReport";
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

const SAMPLE_CSV = `Name,Age,Salary,Department,JoinedDate,IsRemote
Alice Smith,28,75000,Engineering,2021-03-15,true
Bob Jones,34,92000,Sales,2019-10-01,false
Charlie Brown,45,120000,Engineering,2015-06-20,true
Diana Prince,29,88000,Marketing,2022-01-10,true
Ethan Hunt,38,105000,Operations,2018-05-12,false
Fiona Gallagher,,62000,Sales,2023-08-01,true
George Clark,50,,Engineering,2012-11-30,false
Hannah Abbott,26,58000,Marketing,2023-04-15,true
Ian Malcolm,42,115000,Research,2016-09-05,false
Julia Roberts,31,95000,Operations,,true`;

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

  const isDesktop = isVSCodeEnv();

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
    if (isDesktop) {
      window.addEventListener("message", handleMessage);
      postMessage({ type: "WEBVIEW_READY" });
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [handleMessage, isDesktop]);

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
    if (isDesktop) {
      postMessage({ type: "RE_ANALYZE" });
    }
  };

  const handleExport = () => {
    if (isDesktop) {
      postMessage({ type: "EXPORT_REPORT", payload: { format: "html" } });
    } else {
      if (!metadata || !preview || !columns || !missing || !duplicates || !quality) return;
      const profile: DatasetProfile = {
        metadata,
        preview,
        columns,
        missing,
        duplicates,
        correlation: correlation ?? null,
        outliers: outliers ?? [],
        quality,
        insights: insights ?? undefined,
      };
      try {
        const html = generateHtmlReport(profile);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${metadata.fileName.split(".")[0]}_DataPrism_Report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Failed to export report: " + (err as Error).message);
      }
    }
  };

  const runAnalysis = async (fileName: string, content: string, size: number) => {
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

    setProgress(2);
    try {
      await analyzeFileInBrowser(
        fileName,
        content,
        size,
        {
          onProgress: (stage, percent) => {
            setProgress(percent);
            if (stage === "complete") setComplete(true);
          },
          onMetadata: (data) => setMetadata(data),
          onPreview: (data) => setPreview(data),
          onColumns: (data) => setColumns(data),
          onMissing: (data) => setMissing(data),
          onDuplicates: (data) => setDuplicates(data),
          onCorrelation: (data) => setCorrelation(data),
          onOutliers: (data) => setOutliers(data),
          onQuality: (data) => setQuality(data),
          onComplete: (profile) => {
            setComplete(true);
            setProgress(100);
            if (profile.insights) {
              setInsights(profile.insights);
            }
          },
          onError: (stage, message) => {
            setError({ stage, message });
          }
        }
      );
    } catch (err) {
      setError({ stage: "metadata", message: (err as Error).message });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    runAnalysis(file.name, text, file.size);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const text = await file.text();
      runAnalysis(file.name, text, file.size);
    }
  };

  const loadSampleData = () => {
    runAnalysis("employee_salary_sample.csv", SAMPLE_CSV, SAMPLE_CSV.length);
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

  if (!isDesktop && !metadata) {
    return (
      <div className="app" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 24, background: "radial-gradient(circle at top right, #1a1a2e, #0b0b16)" }}>
        <div 
          className="card"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            maxWidth: 600,
            width: "100%",
            padding: 40,
            borderRadius: 24,
            border: "1px dashed rgba(129, 140, 248, 0.4)",
            background: "rgba(22, 28, 38, 0.75)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            animation: "fadeIn 0.5s ease"
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 10 }}>📊</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg, #818cf8 0%, #2dd4bf 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            DataPrism Profiler
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 15, lineHeight: 1.6, margin: "0 auto", maxWidth: 460 }}>
            Instant dataset exploration, profiling, and quality analysis for CSV and JSON files — fully offline, right in your browser.
          </p>

          <div 
            style={{
              margin: "24px 0",
              padding: "32px 20px",
              border: "2px dashed rgba(255,255,255,0.08)",
              borderRadius: 16,
              background: "rgba(0,0,0,0.2)",
              cursor: "pointer",
              transition: "border-color 0.2s"
            }}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📥</div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e7eb" }}>Drag & drop file here or click to browse</span>
            <input 
              id="file-input"
              type="file" 
              accept=".csv,.json" 
              style={{ display: "none" }} 
              onChange={handleFileChange}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button 
              onClick={loadSampleData}
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              🚀 Try with Sample Dataset
            </button>
            <span style={{ fontSize: 11, color: "#4b5563" }}>Supports files up to 100MB · 100% offline & secure</span>
          </div>
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
