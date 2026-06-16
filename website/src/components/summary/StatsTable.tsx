import type { ColumnProfile } from "../../types";

interface Props {
  columns: ColumnProfile[];
}

export default function StatsTable({ columns }: Props) {
  return (
    <div className="card fade-in">
      <div className="card-header">
        <span className="card-title">Column Statistics</span>
        <span className="card-subtitle">{columns.length} columns</span>
      </div>
      <div className="data-table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Non-Null</th>
              <th>Unique</th>
              <th>Null %</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.info.name}>
                <td style={{ fontWeight: 600 }}>{col.info.name}</td>
                <td>
                  <span className={`badge ${col.info.type}`}>{col.info.type}</span>
                </td>
                <td>{col.info.totalCount - col.info.nullCount}</td>
                <td>{col.info.uniqueCount}</td>
                <td>{col.info.nullPercentage}%</td>
                <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {formatDetails(col)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDetails(col: ColumnProfile): string {
  if (col.numericStats) {
    const s = col.numericStats;
    return `mean=${s.mean}, std=${s.stdDev}, [${s.min}, ${s.max}]`;
  }
  if (col.categoricalStats) {
    return `top="${col.categoricalStats.topValue}" (${col.categoricalStats.topPercentage}%)`;
  }
  if (col.datetimeStats) {
    return `${col.datetimeStats.minDate} → ${col.datetimeStats.maxDate}`;
  }
  return "";
}
