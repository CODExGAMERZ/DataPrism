import type { DatasetProfile } from "../types/dataset";

export function generateHtmlReport(profile: DatasetProfile): string {
  const { metadata, preview, columns, missing, duplicates, correlation, outliers, quality } = profile;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DataLens Report — ${metadata.fileName}</title>
<style>
  :root { --bg: #0f0f1a; --surface: #1a1a2e; --surface2: #252540; --border: #2d2d4a; --text: #e0e0f0; --text-muted: #8888aa; --accent: #7c5cfc; --accent2: #00d4aa; --red: #ff5577; --orange: #ffaa44; --green: #44dd88; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; line-height: 1.6; }
  .container { max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  h2 { font-size: 1.3rem; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
  h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; color: var(--accent2); }
  .subtitle { color: var(--text-muted); margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.2rem; }
  .card .label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.6rem; font-weight: 700; margin-top: 0.3rem; }
  .score { font-size: 3rem; font-weight: 800; text-align: center; padding: 1.5rem; }
  .score.high { color: var(--green); }
  .score.medium { color: var(--orange); }
  .score.low { color: var(--red); }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
  th, td { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid var(--border); }
  th { background: var(--surface2); color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
  td { background: var(--surface); }
  tr:hover td { background: var(--surface2); }
  .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
  .badge.warn { background: rgba(255,170,68,0.15); color: var(--orange); }
  .badge.ok { background: rgba(68,221,136,0.15); color: var(--green); }
  .badge.bad { background: rgba(255,85,119,0.15); color: var(--red); }
  .penalty-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
  .penalty-row .factor { font-weight: 600; }
  .penalty-row .pts { color: var(--red); }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.8rem; text-align: center; }
  .correlation-grid { display: grid; gap: 1px; background: var(--border); border-radius: 8px; overflow: hidden; margin: 1rem 0; }
  .corr-cell { padding: 0.4rem; text-align: center; font-size: 0.75rem; font-weight: 600; }
  .corr-header { background: var(--surface2); color: var(--text-muted); font-size: 0.7rem; }
</style>
</head>
<body>
<div class="container">
  <h1>DataLens Report</h1>
  <p class="subtitle">${metadata.fileName} — Generated ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>

  <h2>Overview</h2>
  <div class="grid">
    <div class="card"><div class="label">Rows</div><div class="value">${metadata.rows.toLocaleString()}</div></div>
    <div class="card"><div class="label">Columns</div><div class="value">${metadata.cols}</div></div>
    <div class="card"><div class="label">File Size</div><div class="value">${formatSize(metadata.sizeBytes)}</div></div>
    <div class="card"><div class="label">Missing</div><div class="value">${missing.overallPercentage}%</div></div>
    <div class="card"><div class="label">Duplicates</div><div class="value">${duplicates.totalDuplicates.toLocaleString()}</div></div>
    <div class="card"><div class="label">Memory</div><div class="value">${metadata.memoryUsageMB} MB</div></div>
  </div>
  ${metadata.sampled ? '<p><span class="badge warn">⚡ Sampled</span> Analysis based on ' + (metadata.sampledRows?.toLocaleString() || "sample") + " rows</p>" : ""}

  <h2>Data Quality Score</h2>
  <div class="card">
    <div class="score ${quality.score >= 80 ? "high" : quality.score >= 50 ? "medium" : "low"}">${quality.score}/100</div>
    ${quality.penalties.filter((p) => p.penalty > 0).map((p) => `<div class="penalty-row"><span class="factor">${p.factor}</span><span class="pts">−${p.penalty}</span></div>`).join("")}
  </div>

  <h2>Data Preview (First ${Math.min(20, preview.rows.length)} Rows)</h2>
  <div style="overflow-x:auto">
  <table>
    <thead><tr>${preview.columns.map((c) => `<th>${escapeHtml(c.name)}<br><small>${c.type}</small></th>`).join("")}</tr></thead>
    <tbody>${preview.rows.slice(0, 20).map((row) => `<tr>${preview.columns.map((c) => `<td>${row[c.name] === null ? '<span style="color:var(--red)">null</span>' : escapeHtml(String(row[c.name]))}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
  </div>

  <h2>Column Statistics</h2>
  <table>
    <thead><tr><th>Column</th><th>Type</th><th>Non-Null</th><th>Unique</th><th>Null %</th><th>Details</th></tr></thead>
    <tbody>${columns.map((c) => {
      let details = "";
      if (c.numericStats) details = `mean=${c.numericStats.mean}, std=${c.numericStats.stdDev}, range=[${c.numericStats.min}, ${c.numericStats.max}]`;
      else if (c.categoricalStats) details = `top="${c.categoricalStats.topValue}" (${c.categoricalStats.topPercentage}%)`;
      else if (c.datetimeStats) details = `${c.datetimeStats.minDate} → ${c.datetimeStats.maxDate}`;
      return `<tr><td><strong>${escapeHtml(c.info.name)}</strong></td><td><span class="badge ok">${c.info.type}</span></td><td>${c.info.totalCount - c.info.nullCount}</td><td>${c.info.uniqueCount}</td><td>${c.info.nullPercentage}%</td><td>${details}</td></tr>`;
    }).join("")}</tbody>
  </table>

  <h2>Missing Values</h2>
  ${missing.columns.filter((c) => c.percentage > 0).length === 0 ? "<p>No missing values detected.</p>" :
    `<table><thead><tr><th>Column</th><th>Missing</th><th>Percentage</th><th>Bar</th></tr></thead><tbody>${missing.columns.filter((c) => c.percentage > 0).map((c) => `<tr><td>${escapeHtml(c.name)}</td><td>${c.missing}</td><td>${c.percentage}%</td><td><div style="width:${Math.min(c.percentage, 100)}%;height:8px;background:var(--red);border-radius:4px"></div></td></tr>`).join("")}</tbody></table>`}

  ${correlation ? `<h2>Correlation Matrix</h2><p>Method: ${correlation.method}${correlation.warning ? " — " + correlation.warning : ""}</p>
  <div style="overflow-x:auto"><table><thead><tr><th></th>${correlation.labels.map((l) => `<th>${escapeHtml(l)}</th>`).join("")}</tr></thead><tbody>${correlation.labels.map((label, i) => `<tr><th>${escapeHtml(label)}</th>${correlation!.values[i].map((v) => `<td style="background:${corrColor(v)};color:#fff;text-align:center;font-size:0.8rem">${v.toFixed(2)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}

  <h2>Outliers</h2>
  ${outliers.length === 0 ? "<p>No significant outliers detected.</p>" :
    `<table><thead><tr><th>Column</th><th>Method</th><th>Count</th><th>Percentage</th><th>Extreme Values</th></tr></thead><tbody>${outliers.map((o) => `<tr><td>${escapeHtml(o.column)}</td><td>${o.method}</td><td>${o.outlierCount}</td><td>${o.outlierPercentage}%</td><td>${o.extremeValues.slice(0, 3).map((e) => e.value).join(", ")}</td></tr>`).join("")}</tbody></table>`}

  <div class="footer">Generated by DataLens — Dataset Explorer for VS Code</div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function corrColor(value: number): string {
  if (value >= 0.7) return "#2563eb";
  if (value >= 0.3) return "#3b82f6aa";
  if (value >= 0) return "#64748b88";
  if (value >= -0.3) return "#f59e0baa";
  if (value >= -0.7) return "#ef4444aa";
  return "#dc2626";
}
