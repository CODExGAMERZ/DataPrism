import type { OutlierResult } from "../../types";

interface Props {
  outliers: OutlierResult[];
}

export default function OutlierSummary({ outliers }: Props) {
  if (outliers.length === 0) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <span className="card-title">Outlier Detection</span>
        </div>
        <div className="empty-state" style={{ padding: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
          <p>No significant outliers detected.</p>
        </div>
      </div>
    );
  }

  const totalOutliers = outliers.reduce((s, o) => s + o.outlierCount, 0);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <span className="card-title">Outlier Detection</span>
        <span className="card-subtitle">{totalOutliers} outliers across {outliers.length} columns</span>
      </div>
      {outliers.map((o) => (
        <div key={o.column} className="outlier-card">
          <div className="outlier-header">
            <div>
              <strong>{o.column}</strong>
              <div className="outlier-detail">{o.method} method · {o.outlierPercentage}% of values</div>
            </div>
            <div className="outlier-count">{o.outlierCount}</div>
          </div>
          {o.extremeValues.length > 0 && (
            <div className="extreme-values">
              {o.extremeValues.map((e, i) => (
                <span key={i} className="extreme-chip">{e.value}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
