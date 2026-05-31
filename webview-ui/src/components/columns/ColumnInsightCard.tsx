import type { ColumnProfile } from "../../types";

interface Props {
  column: ColumnProfile;
}

export default function ColumnInsightCard({ column }: Props) {
  const { info, numericStats, categoricalStats, datetimeStats, suggestion } = column;

  return (
    <div className="column-card fade-in">
      <div className="column-header">
        <span className="column-name">{info.name}</span>
        <span className={`badge ${info.type}`}>{info.type}</span>
        {info.hasMixedTypes && <span className="badge mixed">mixed</span>}
      </div>

      <div className="column-stats-grid">
        <StatCell label="Total" value={info.totalCount.toLocaleString()} />
        <StatCell label="Non-Null" value={(info.totalCount - info.nullCount).toLocaleString()} />
        <StatCell label="Null %" value={`${info.nullPercentage}%`} />
        <StatCell label="Unique" value={info.uniqueCount.toLocaleString()} />

        {numericStats && (
          <>
            <StatCell label="Mean" value={numericStats.mean.toString()} />
            <StatCell label="Median" value={numericStats.median.toString()} />
            <StatCell label="Std Dev" value={numericStats.stdDev.toString()} />
            <StatCell label="Min" value={numericStats.min.toString()} />
            <StatCell label="Max" value={numericStats.max.toString()} />
            <StatCell label="Q25" value={numericStats.q25.toString()} />
            <StatCell label="Q75" value={numericStats.q75.toString()} />
            <StatCell label="Skewness" value={numericStats.skewness.toString()} />
          </>
        )}

        {categoricalStats && (
          <>
            <StatCell label="Top Value" value={categoricalStats.topValue} />
            <StatCell label="Top Freq" value={`${categoricalStats.topPercentage}%`} />
          </>
        )}

        {datetimeStats && (
          <>
            <StatCell label="Min Date" value={datetimeStats.minDate} />
            <StatCell label="Max Date" value={datetimeStats.maxDate} />
            <StatCell label="Range" value={`${datetimeStats.rangeDays} days`} />
          </>
        )}
      </div>

      {categoricalStats && categoricalStats.distribution.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Distribution (Top {Math.min(categoricalStats.distribution.length, 5)})
          </div>
          {categoricalStats.distribution.slice(0, 5).map((d) => (
            <div key={d.value} className="missing-bar-row">
              <span className="missing-bar-label" title={d.value}>{d.value}</span>
              <div className="missing-bar-track">
                <div
                  className="missing-bar-fill"
                  style={{
                    width: `${d.percentage}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
              <span className="missing-bar-pct">{d.percentage}%</span>
            </div>
          ))}
        </div>
      )}

      {suggestion && <div className="suggestion-box">💡 {suggestion}</div>}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="column-stat">
      <div className="column-stat-label">{label}</div>
      <div className="column-stat-value">{value}</div>
    </div>
  );
}
