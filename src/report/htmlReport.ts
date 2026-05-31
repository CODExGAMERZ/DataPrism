import type { DatasetProfile } from "../types/dataset";

export function generateHtmlReport(profile: DatasetProfile): string {
  const { metadata, preview, columns, missing, duplicates, correlation, outliers, quality, insights } = profile;

  // Generate feature suggestions HTML
  let featuresHtml = "";
  if (insights?.features && insights.features.length > 0) {
    featuresHtml = `
      <h2>Feature Engineering Suggestions</h2>
      <div class="suggestions-container">
        ${insights.features.map(f => `
          <div class="suggest-card ${f.impact}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>${escapeHtml(f.title)}</strong>
              <span class="impact-badge ${f.impact}">${f.impact} Impact</span>
            </div>
            <p style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(f.description)}</p>
          </div>
        `).join("")}
      </div>
    `;
  } else {
    featuresHtml = `
      <h2>Feature Engineering Suggestions</h2>
      <p class="subtitle">No specific feature engineering suggestions are available for this dataset.</p>
    `;
  }

  // Generate missing value recommendations HTML
  let missingRecsHtml = "";
  if (insights?.missing && insights.missing.length > 0) {
    missingRecsHtml = `
      <h2>Missing Value Recommendations</h2>
      <div class="missing-recs-container">
        ${insights.missing.map(m => `
          <div class="rec-card">
            <div class="rec-header">
              <strong>Column: <code>${escapeHtml(m.column)}</code></strong>
              <span class="badge warn">${m.percentage}% Missing (${m.missingCount.toLocaleString()} values)</span>
            </div>
            <p style="margin: 8px 0; font-size: 0.85rem;"><strong>Recommended Strategy:</strong> ${escapeHtml(m.strategy)}</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(m.recommendation)}</p>
            <div class="recipe-code">
<pre><code>${escapeHtml(m.codeSnippet)}</code></pre>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } else {
    missingRecsHtml = `
      <h2>Missing Value Recommendations</h2>
      <p class="subtitle">No columns with missing values require imputation.</p>
    `;
  }

  // Generate Competition insights HTML
  let competitionHtml = "";
  if (insights?.competition) {
    const comp = insights.competition;
    const leakageHtml = comp.targetLeakageAlerts.length > 0
      ? comp.targetLeakageAlerts.map(l => `
          <div class="leakage-alert ${l.severity}">
            <strong style="color: var(--red);">[${l.severity} Leakage Risk] Column "${escapeHtml(l.column)}"</strong>: ${escapeHtml(l.reason)}
          </div>
        `).join("")
      : '<p style="color: var(--green); font-size: 0.85rem;">No significant target leakage risks detected.</p>';

    competitionHtml = `
      <h2>Machine Learning & Competition Insights</h2>
      <div class="grid">
        <div class="card" style="grid-column: span 2;">
          <div class="label">Suggested Target Variable</div>
          <div class="value" style="color: var(--accent2);"><code>${escapeHtml(comp.targetColumnSuggestion || "N/A")}</code></div>
        </div>
        <div class="card" style="grid-column: span 2;">
          <div class="label">Assumed Task</div>
          <div class="value" style="color: var(--accent);">${escapeHtml(insights.summary?.assumedTask || "Tabular Task")}</div>
        </div>
      </div>

      <div class="card" style="margin-top: 12px;">
        <div class="label">Validation Strategy</div>
        <div class="value" style="font-size: 1.15rem; margin-top: 6px; color: var(--accent2);">${escapeHtml(comp.validationStrategy)}</div>
        <p style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(comp.validationDetails)}</p>
      </div>

      <h3>Data Leakage Warnings</h3>
      <div class="leakage-container" style="margin: 10px 0;">
        ${leakageHtml}
      </div>

      <h3>Recommended Model Families</h3>
      <table>
        <thead>
          <tr>
            <th>Model Family</th>
            <th>Suitability</th>
            <th>Reasoning</th>
          </tr>
        </thead>
        <tbody>
          ${comp.modelSuggestions.map(ms => `
            <tr>
              <td><strong>${escapeHtml(ms.model)}</strong></td>
              <td><span class="badge ${ms.suitability.toLowerCase() === "high" ? "ok" : ms.suitability.toLowerCase() === "medium" ? "warn" : "bad"}">${ms.suitability}</span></td>
              <td style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(ms.reason)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h3>Recommended Evaluation Metrics</h3>
      <ul style="margin-left: 20px; font-size: 0.85rem;">
        ${comp.metricSuggestions.map(metric => `
          <li style="margin-bottom: 4px;">${escapeHtml(metric)}</li>
        `).join("")}
      </ul>
    `;
  }

  // Executive summary HTML
  let execSummaryHtml = "";
  if (insights?.summary) {
    const s = insights.summary;
    execSummaryHtml = `
      <div class="card" style="background: linear-gradient(135deg, rgba(124, 92, 252, 0.1) 0%, rgba(0, 212, 170, 0.05) 100%); border: 1px solid var(--accent);">
        <div class="label" style="color: var(--accent); font-weight: 700;">Executive Summary</div>
        <p style="font-size: 0.95rem; margin-top: 6px;">${escapeHtml(s.description)}</p>
        <div style="display: flex; gap: 20px; margin-top: 12px; border-top: 1px solid var(--border); padding-top: 10px;">
          <div>
            <span class="label">Key Predictors</span>
            <div style="font-size: 0.85rem; font-weight: 600; margin-top: 2px;">${escapeHtml(s.keyPredictors.join(", ") || "None")}</div>
          </div>
          <div>
            <span class="label">Quality Issues</span>
            <div style="font-size: 0.85rem; font-weight: 600; margin-top: 2px; color: ${s.qualityIssuesCount > 0 ? "var(--orange)" : "var(--green)"};">${s.qualityIssuesCount} issues detected</div>
          </div>
        </div>
        <div style="margin-top: 10px;">
          <span class="label">ML Readiness</span>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(s.mlSuitability)}</p>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DataPrism Auto-EDA Report — ${metadata.fileName}</title>
<style>
  :root { 
    --bg: #0f0f1a; 
    --surface: #1a1a2e; 
    --surface2: #252540; 
    --border: #2d2d4a; 
    --text: #e0e0f0; 
    --text-muted: #8888aa; 
    --accent: #7c5cfc; 
    --accent2: #00d4aa; 
    --red: #ff5577; 
    --orange: #ffaa44; 
    --green: #44dd88; 
    --blue: #3b82f6;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    background: var(--bg); 
    color: var(--text); 
    padding: 2rem; 
    line-height: 1.6; 
  }
  .container { max-width: 1100px; margin: 0 auto; }
  h1 { 
    font-size: 2rem; 
    margin-bottom: 0.3rem; 
    background: linear-gradient(135deg, var(--accent), var(--accent2)); 
    -webkit-background-clip: text; 
    -webkit-text-fill-color: transparent; 
  }
  h2 { 
    font-size: 1.4rem; 
    margin: 2.5rem 0 1rem; 
    padding-bottom: 0.5rem; 
    border-bottom: 1px solid var(--border); 
    color: var(--text);
  }
  h3 { 
    font-size: 1.15rem; 
    margin: 1.5rem 0 0.8rem; 
    color: var(--accent2); 
  }
  .subtitle { color: var(--text-muted); margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .card { 
    background: var(--surface); 
    border: 1px solid var(--border); 
    border-radius: 12px; 
    padding: 1.2rem; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .card .label { 
    font-size: 0.75rem; 
    color: var(--text-muted); 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
  }
  .card .value { font-size: 1.5rem; font-weight: 700; margin-top: 0.3rem; }
  .score { font-size: 3rem; font-weight: 800; text-align: center; padding: 1rem; }
  .score.high { color: var(--green); }
  .score.medium { color: var(--orange); }
  .score.low { color: var(--red); }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
  th, td { padding: 0.7rem 0.9rem; text-align: left; border-bottom: 1px solid var(--border); }
  th { 
    background: var(--surface2); 
    color: var(--text-muted); 
    font-weight: 600; 
    text-transform: uppercase; 
    font-size: 0.75rem; 
    letter-spacing: 0.05em; 
  }
  td { background: var(--surface); }
  tr:hover td { background: var(--surface2); }
  
  .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
  .badge.warn { background: rgba(255,170,68,0.15); color: var(--orange); }
  .badge.ok { background: rgba(68,221,136,0.15); color: var(--green); }
  .badge.bad { background: rgba(255,85,119,0.15); color: var(--red); }
  .badge.numeric { background: rgba(59, 130, 246, 0.15); color: var(--blue); }
  .badge.categorical { background: rgba(124, 92, 252, 0.15); color: var(--accent); }
  
  .penalty-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
  .penalty-row .factor { font-weight: 600; }
  .penalty-row .pts { color: var(--red); }
  
  .suggest-card { 
    background: var(--surface); 
    border: 1px solid var(--border); 
    border-radius: 8px; 
    padding: 12px 16px; 
    margin-bottom: 12px;
    border-left: 4px solid var(--accent);
  }
  .suggest-card.High { border-left-color: var(--red); }
  .suggest-card.Medium { border-left-color: var(--orange); }
  .suggest-card.Low { border-left-color: var(--blue); }
  
  .impact-badge { 
    display: inline-block; 
    padding: 2px 8px; 
    border-radius: 99px; 
    font-size: 10px; 
    font-weight: 700;
  }
  .impact-badge.High { background: rgba(255, 85, 119, 0.15); color: var(--red); }
  .impact-badge.Medium { background: rgba(255, 170, 68, 0.15); color: var(--orange); }
  .impact-badge.Low { background: rgba(59, 130, 246, 0.15); color: var(--blue); }
  
  .rec-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
  }
  .rec-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 8px; }
  .recipe-code {
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 10px;
    border-radius: 6px;
    margin-top: 10px;
    overflow-x: auto;
    font-family: monospace;
    font-size: 0.8rem;
  }
  
  .leakage-alert {
    padding: 10px 12px;
    background: rgba(255, 85, 119, 0.1);
    border: 1px solid rgba(255, 85, 119, 0.2);
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 0.85rem;
  }
  
  .footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.8rem; text-align: center; }
</style>
</head>
<body>
<div class="container">
  <h1>DataPrism Auto-EDA Report</h1>
  <p class="subtitle">${metadata.fileName} — Generated ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>

  ${execSummaryHtml}

  <h2>Overview</h2>
  <div class="grid">
    <div class="card"><div class="label">Rows</div><div class="value">${metadata.rows.toLocaleString()}</div></div>
    <div class="card"><div class="label">Columns</div><div class="value">${metadata.cols}</div></div>
    <div class="card"><div class="label">File Size</div><div class="value">${formatSize(metadata.sizeBytes)}</div></div>
    <div class="card"><div class="label">Missing</div><div class="value">${missing.overallPercentage}%</div></div>
    <div class="card"><div class="label">Duplicates</div><div class="value">${duplicates.totalDuplicates.toLocaleString()}</div></div>
    <div class="card"><div class="label">Memory</div><div class="value">${metadata.memoryUsageMB} MB</div></div>
  </div>
  ${metadata.sampled ? '<p style="margin-top: 10px;"><span class="badge warn">⚡ Sampled</span> Analysis based on ' + (metadata.sampledRows?.toLocaleString() || "sample") + " rows</p>" : ""}

  <h2>Data Quality Score</h2>
  <div class="card">
    <div class="score ${quality.score >= 80 ? "high" : quality.score >= 50 ? "medium" : "low"}">${quality.score}/100</div>
    ${quality.penalties.filter((p) => p.penalty > 0).map((p) => `<div class="penalty-row"><span class="factor">${p.factor}</span><span class="pts">−${p.penalty}</span></div>`).join("")}
  </div>

  ${featuresHtml}

  ${missingRecsHtml}

  ${competitionHtml}

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
      return `<tr><td><strong>${escapeHtml(c.info.name)}</strong></td><td><span class="badge numeric">${c.info.type}</span></td><td>${c.info.totalCount - c.info.nullCount}</td><td>${c.info.uniqueCount}</td><td>${c.info.nullPercentage}%</td><td>${details}</td></tr>`;
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

  <div class="footer">Generated by DataPrism — Dataset Explorer for VS Code</div>
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
