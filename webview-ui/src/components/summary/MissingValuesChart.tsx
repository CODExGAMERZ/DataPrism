import type { MissingValueSummary } from "../../types";

interface Props {
  missing: MissingValueSummary;
}

export default function MissingValuesChart({ missing }: Props) {
  const columnsWithMissing = missing.columns.filter((c) => c.percentage > 0);

  if (columnsWithMissing.length === 0) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <span className="card-title">Missing Values</span>
        </div>
        <div className="empty-state" style={{ padding: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
          <p>No missing values detected.</p>
        </div>
      </div>
    );
  }

  const maxPct = Math.max(...columnsWithMissing.map((c) => c.percentage));

  return (
    <div className="card fade-in">
      <div className="card-header">
        <span className="card-title">Missing Values</span>
        <span className="card-subtitle">
          {missing.totalMissing.toLocaleString()} total ({missing.overallPercentage}%)
        </span>
      </div>
      <div className="missing-bar-container">
        {columnsWithMissing.slice(0, 20).map((col) => (
          <div key={col.name} className="missing-bar-row">
            <span className="missing-bar-label" title={col.name}>{col.name}</span>
            <div className="missing-bar-track">
              <div
                className="missing-bar-fill"
                style={{
                  width: `${(col.percentage / maxPct) * 100}%`,
                  background: col.percentage > 50
                    ? "var(--red)"
                    : col.percentage > 20
                    ? "var(--orange)"
                    : "var(--accent)",
                }}
              />
            </div>
            <span className="missing-bar-pct">{col.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
