import type { FileMetadata, MissingValueSummary, DuplicateSummary } from "../../types";

interface Props {
  metadata: FileMetadata;
  missing: MissingValueSummary | null;
  duplicates: DuplicateSummary;
}

export default function OverviewCards({ metadata, missing, duplicates }: Props) {
  const metrics = [
    { label: "Rows", value: metadata.rows.toLocaleString() },
    { label: "Columns", value: metadata.cols.toString() },
    { label: "File Size", value: formatBytes(metadata.sizeBytes) },
    { label: "Memory", value: `${metadata.memoryUsageMB} MB` },
    { label: "Missing", value: missing ? `${missing.overallPercentage}%` : "—" },
    { label: "Duplicates", value: duplicates.totalDuplicates.toLocaleString() },
  ];

  return (
    <div className="overview-grid">
      {metrics.map((m) => (
        <div key={m.label} className="metric-card">
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">{m.value}</div>
        </div>
      ))}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
