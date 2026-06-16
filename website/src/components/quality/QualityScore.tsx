import type { QualityScore as QS } from "../../types";

interface Props {
  quality: QS;
}

export default function QualityScoreView({ quality }: Props) {
  const scoreClass = quality.score >= 80 ? "high" : quality.score >= 50 ? "medium" : "low";

  return (
    <div className="card fade-in">
      <div className="quality-gauge">
        <div
          className={`quality-score-circle ${scoreClass}`}
          style={{ "--score-pct": quality.score } as React.CSSProperties}
        >
          {quality.score}
        </div>
        <div className="quality-label">Data Quality Score</div>
      </div>

      <div className="penalty-list">
        {quality.penalties.map((p) => (
          <div key={p.factor} className="penalty-item">
            <div>
              <div className="penalty-factor">{p.factor}</div>
              <div className="penalty-detail">{p.detail}</div>
            </div>
            <div className={`penalty-value ${p.penalty > 0 ? "active" : "none"}`}>
              {p.penalty > 0 ? `−${p.penalty}` : "✓"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
