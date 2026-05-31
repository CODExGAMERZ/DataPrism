import type { DatasetProfile } from "../types/dataset";

export function generateMarkdownReport(profile: DatasetProfile): string {
  const { metadata, columns, missing, duplicates, correlation, outliers, quality, insights } = profile;

  const lines: string[] = [];

  // Title
  lines.push(`# DataPrism Auto-EDA Report: ${metadata.fileName}`);
  lines.push(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`);

  // Overview Table
  lines.push(`## Dataset Overview`);
  lines.push(`| Metric | Value |`);
  lines.push(`| :--- | :--- |`);
  lines.push(`| **Rows** | ${metadata.rows.toLocaleString()} |`);
  lines.push(`| **Columns** | ${metadata.cols} |`);
  lines.push(`| **File Size** | ${formatSize(metadata.sizeBytes)} |`);
  lines.push(`| **Memory Usage** | ${metadata.memoryUsageMB} MB |`);
  lines.push(`| **Missing Cells** | ${missing.totalMissing.toLocaleString()} (${missing.overallPercentage}%) |`);
  lines.push(`| **Duplicate Rows** | ${duplicates.totalDuplicates.toLocaleString()} (${duplicates.duplicatePercentage}%) |`);
  if (metadata.sampled) {
    lines.push(`\n*Note: Analysis was performed on a sample of ${metadata.sampledRows?.toLocaleString()} rows.*\n`);
  } else {
    lines.push("");
  }

  // Plain Text Summary / AI Explanation
  if (insights?.summary) {
    const s = insights.summary;
    lines.push(`### Executive Summary`);
    lines.push(`- **Description**: ${s.description}`);
    lines.push(`- **Assumed Machine Learning Task**: ${s.assumedTask}`);
    lines.push(`- **Suggested Target Column**: \`${insights.competition.targetColumnSuggestion || "N/A"}\``);
    lines.push(`- **Key Predictors**: ${s.keyPredictors.join(", ") || "None detected"}`);
    lines.push(`- **Machine Learning Suitability**: ${s.mlSuitability}\n`);
  }

  // Quality Score
  lines.push(`## Data Quality Score: ${quality.score}/100`);
  if (quality.penalties.filter(p => p.penalty > 0).length > 0) {
    lines.push(`### Quality Penalties`);
    quality.penalties
      .filter(p => p.penalty > 0)
      .forEach(p => {
        lines.push(`- **${p.factor}**: -${p.penalty} pts (${p.detail})`);
      });
    lines.push("");
  } else {
    lines.push(`No significant quality issues detected!\n`);
  }

  // Columns Statistics
  lines.push(`## Column Profiles`);
  lines.push(`| Column | Type | Non-Null | Unique | Null % | Details |`);
  lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- |`);
  columns.forEach(c => {
    let details = "";
    if (c.numericStats) {
      const ns = c.numericStats;
      details = `Mean: ${ns.mean}, Std: ${ns.stdDev}, Range: [${ns.min}, ${ns.max}]`;
    } else if (c.categoricalStats) {
      const cs = c.categoricalStats;
      details = `Top: "${cs.topValue}" (${cs.topPercentage}%)`;
    } else if (c.datetimeStats) {
      const ds = c.datetimeStats;
      details = `${ds.minDate} to ${ds.maxDate}`;
    }
    lines.push(`| **${c.info.name}** | \`${c.info.type}\` | ${(c.info.totalCount - c.info.nullCount).toLocaleString()} | ${c.info.uniqueCount.toLocaleString()} | ${c.info.nullPercentage}% | ${details} |`);
  });
  lines.push("");

  // Missing Value recommendations
  if (insights?.missing && insights.missing.length > 0) {
    lines.push(`## Missing Value Recommendations`);
    insights.missing.forEach(m => {
      lines.push(`### Column: \`${m.column}\``);
      lines.push(`- **Missing**: ${m.missingCount.toLocaleString()} values (${m.percentage}%)`);
      lines.push(`- **Recommended Strategy**: **${m.strategy}**`);
      lines.push(`- **Rationale**: ${m.recommendation}`);
      lines.push(`\n**Pandas Imputation Recipe**:`);
      lines.push("```python");
      lines.push(m.codeSnippet);
      lines.push("```\n");
    });
  }

  // Feature Suggestions
  if (insights?.features && insights.features.length > 0) {
    lines.push(`## Feature Engineering Suggestions`);
    lines.push(`| Feature / Column | Suggestion | Impact | Description |`);
    lines.push(`| :--- | :--- | :--- | :--- |`);
    insights.features.forEach(f => {
      lines.push(`| \`${f.column}\` | **${f.type}** | **${f.impact}** | ${f.description} |`);
    });
    lines.push("");
  }

  // Competition Insights
  if (insights?.competition) {
    const comp = insights.competition;
    lines.push(`## Machine Learning & Competition Strategy`);
    lines.push(`- **Target Column**: \`${comp.targetColumnSuggestion || "N/A"}\``);
    lines.push(`- **Validation Strategy**: **${comp.validationStrategy}**`);
    lines.push(`- **Validation Details**: ${comp.validationDetails}\n`);

    // Target Leakage
    lines.push(`### Data Leakage Risk`);
    if (comp.targetLeakageAlerts.length > 0) {
      comp.targetLeakageAlerts.forEach(leak => {
        lines.push(`- **[${leak.severity} Severity] Column \`${leak.column}\`**: ${leak.reason}`);
      });
      lines.push("");
    } else {
      lines.push(`No significant data leakage risks detected.\n`);
    }

    // Recommended Models
    lines.push(`### Recommended Model Families`);
    lines.push(`| Model | Suitability | Rationale |`);
    lines.push(`| :--- | :--- | :--- |`);
    comp.modelSuggestions.forEach(ms => {
      lines.push(`| ${ms.model} | **${ms.suitability}** | ${ms.reason} |`);
    });
    lines.push("");

    // Recommended Metrics
    lines.push(`### Recommended Evaluation Metrics`);
    comp.metricSuggestions.forEach(metric => {
      lines.push(`- ${metric}`);
    });
    lines.push("");
  }

  // Correlations Summary
  if (correlation) {
    lines.push(`## Strong Correlations (|r| > 0.5)`);
    const n = correlation.labels.length;
    const strongList: string[] = [];
    const handled = new Set<string>();

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = correlation.values[i][j];
        if (Math.abs(val) > 0.5) {
          const colA = correlation.labels[i];
          const colB = correlation.labels[j];
          const key = [colA, colB].sort().join("-");
          if (!handled.has(key)) {
            handled.add(key);
            strongList.push(`- **${colA}** and **${colB}**: r = ${val.toFixed(2)}`);
          }
        }
      }
    }

    if (strongList.length > 0) {
      lines.push(strongList.join("\n") + "\n");
    } else {
      lines.push("No correlation values exceeding |r| > 0.5 were detected.\n");
    }
  }

  // Outliers Summary
  if (outliers.length > 0) {
    lines.push(`## Outlier Summary`);
    lines.push(`| Column | Method | Count | Outlier % | Extreme Values |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
    outliers.forEach(o => {
      const extremes = o.extremeValues.slice(0, 5).map(ev => ev.value).join(", ");
      lines.push(`| \`${o.column}\` | ${o.method} | ${o.outlierCount.toLocaleString()} | ${o.outlierPercentage}% | ${extremes || "N/A"} |`);
    });
    lines.push("");
  }

  // Footer
  lines.push(`---\n*Report generated by DataPrism — Dataset Explorer for VS Code.*`);

  return lines.join("\n");
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
