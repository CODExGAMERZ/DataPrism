import { useState } from "react";
import type { FeatureSuggestion, MissingValueRecommendation, CompetitionInsights, PlainTextSummary } from "../../types";

interface Props {
  insights: {
    summary: PlainTextSummary;
    features: FeatureSuggestion[];
    missing: MissingValueRecommendation[];
    competition: CompetitionInsights;
  } | null;
}

export default function InsightsView({ insights }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!insights) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💡</div>
        <p>Analyzing insights...</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>Please wait for the analysis to complete.</p>
      </div>
    );
  }

  const { summary, features, missing, competition } = insights;

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="insights-view fade-in">
      {/* 1. Executive Summary Card */}
      <div className="exec-summary-card">
        <div className="exec-header">
          <div className="exec-title">
            <span className="sparkle-icon">✨</span> Executive Dataset Summary
          </div>
          <span className={`readiness-badge ${summary.assumedTask.toLowerCase()}`}>
            {summary.assumedTask} Task
          </span>
        </div>
        <p className="exec-desc">{summary.description}</p>
        
        <div className="exec-details-grid">
          <div className="exec-detail-cell">
            <span className="exec-detail-label">Key Predictors</span>
            <span className="exec-detail-value">
              {summary.keyPredictors.length > 0 ? summary.keyPredictors.join(", ") : "None detected"}
            </span>
          </div>
          <div className="exec-detail-cell">
            <span className="exec-detail-label">Quality Issues</span>
            <span className={`exec-detail-value ${summary.qualityIssuesCount > 0 ? "warn" : "good"}`}>
              {summary.qualityIssuesCount.toLocaleString()} issues found
            </span>
          </div>
        </div>

        <div className="ml-readiness-section">
          <span className="exec-detail-label">Machine Learning Suitability</span>
          <p className="ml-suitability-text">{summary.mlSuitability}</p>
        </div>
      </div>

      {/* 2. Feature Engineering Suggestions */}
      <div className="section-container">
        <div className="section-title-wrapper">
          <span className="section-icon">📐</span>
          <span className="section-title">Feature Engineering Suggestions</span>
        </div>
        
        {features.length === 0 ? (
          <p className="no-items-text">No feature engineering suggestions needed. The dataset columns look well-formed!</p>
        ) : (
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-suggest-card ${f.impact.toLowerCase()}`}>
                <div className="feature-card-header">
                  <span className="feature-col-tag"><code>{f.column}</code></span>
                  <span className={`impact-tag ${f.impact.toLowerCase()}`}>{f.impact} Impact</span>
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Missing Value Recommendations with Python Recipes */}
      <div className="section-container">
        <div className="section-title-wrapper">
          <span className="section-icon">🧹</span>
          <span className="section-title">Missing Value Recommendations</span>
        </div>

        {missing.length === 0 ? (
          <p className="no-items-text">No missing values detected. No imputation required!</p>
        ) : (
          <div className="missing-recs-list">
            {missing.map((m, i) => (
              <div key={i} className="missing-rec-card">
                <div className="missing-rec-header">
                  <span className="missing-col-name"><code>{m.column}</code></span>
                  <span className="missing-stats-badge">
                    {m.percentage}% missing ({m.missingCount.toLocaleString()} rows)
                  </span>
                </div>
                <div className="missing-strategy">
                  <strong>Recommended:</strong> {m.strategy}
                </div>
                <p className="missing-rational">{m.recommendation}</p>
                
                <div className="code-recipe-box">
                  <div className="code-header">
                    <span>Pandas Imputation Recipe</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(m.codeSnippet, i)}
                    >
                      {copiedIndex === i ? "✓ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <pre className="code-snippet">
                    <code>{m.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Competition & ML Strategy */}
      <div className="section-container">
        <div className="section-title-wrapper">
          <span className="section-icon">🏆</span>
          <span className="section-title">Competition & Machine Learning Strategy</span>
        </div>

        <div className="strategy-grid">
          {/* Target suggestion */}
          <div className="strategy-card">
            <div className="strategy-card-title">🎯 Target Column Suggestion</div>
            <div className="strategy-target-val">
              <code>{competition.targetColumnSuggestion || "None"}</code>
            </div>
            <div className="strategy-card-desc">
              Inferred as target based on name matching or column positioning. All other insights are oriented around this variable.
            </div>
          </div>

          {/* Validation strategy */}
          <div className="strategy-card">
            <div className="strategy-card-title">🔄 Validation Strategy</div>
            <div className="strategy-validation-val">{competition.validationStrategy}</div>
            <div className="strategy-card-desc">{competition.validationDetails}</div>
          </div>
        </div>

        {/* Leakage alerts */}
        <div className="leakage-section">
          <div className="leakage-title">⚠️ Data Leakage Check</div>
          {competition.targetLeakageAlerts.length === 0 ? (
            <div className="leakage-clean-notice">
              ✓ No obvious target leakage variables detected (no features correlate with target &gt; 0.95).
            </div>
          ) : (
            <div className="leakage-alerts-list">
              {competition.targetLeakageAlerts.map((leak, idx) => (
                <div key={idx} className={`leakage-alert-card ${leak.severity.toLowerCase()}`}>
                  <strong>[{leak.severity} Risk] Column <code>{leak.column}</code></strong>
                  <p>{leak.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model suggestions table */}
        <div style={{ marginTop: 16 }}>
          <div className="strategy-card-title" style={{ marginBottom: 8 }}>Recommended Model Families</div>
          <div className="data-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Model Family</th>
                  <th>Suitability</th>
                  <th>Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {competition.modelSuggestions.map((ms, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{ms.model}</td>
                    <td>
                      <span className={`badge ${ms.suitability.toLowerCase() === "high" ? "datetime" : ms.suitability.toLowerCase() === "medium" ? "boolean" : "mixed"}`}>
                        {ms.suitability}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{ms.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metric suggestions */}
        <div style={{ marginTop: 16 }}>
          <div className="strategy-card-title" style={{ marginBottom: 8 }}>Recommended Evaluation Metrics</div>
          <ul className="metrics-list">
            {competition.metricSuggestions.map((metric, idx) => (
              <li key={idx}>{metric}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
