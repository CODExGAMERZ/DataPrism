import { useRef, useEffect } from "react";
import type { CorrelationMatrix } from "../../types";

interface Props {
  data: CorrelationMatrix;
}

export default function CorrelationHeatmap({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const n = data.labels.length;
    const cellSize = Math.min(Math.max(40, 500 / n), 60);
    const labelWidth = 100;
    const labelHeight = 80;
    const width = labelWidth + n * cellSize;
    const height = labelHeight + n * cellSize;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.font = `10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#8888aa";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i < n; i++) {
      const y = labelHeight + i * cellSize + cellSize / 2;
      ctx.fillText(truncate(data.labels[i], 14), labelWidth - 8, y);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let j = 0; j < n; j++) {
      const x = labelWidth + j * cellSize + cellSize / 2;
      ctx.save();
      ctx.translate(x, labelHeight - 8);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(truncate(data.labels[j], 14), 0, 0);
      ctx.restore();
    }
    ctx.restore();

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const val = data.values[i][j];
        const x = labelWidth + j * cellSize;
        const y = labelHeight + i * cellSize;

        ctx.fillStyle = corrColor(val);
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

        if (n <= 15) {
          ctx.fillStyle = Math.abs(val) > 0.5 ? "#ffffff" : "#cccccc";
          ctx.font = `bold ${Math.min(11, cellSize / 4)}px -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(val.toFixed(2), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }, [data]);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <span className="card-title">Correlation Matrix</span>
        <span className="card-subtitle">
          {data.method.charAt(0).toUpperCase() + data.method.slice(1)} · {data.labels.length} variables
        </span>
      </div>
      {data.warning && <div className="notice">⚠️ {data.warning}</div>}
      <div className="heatmap-container">
        <canvas ref={canvasRef} className="heatmap-canvas" />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#dc2626", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }} />
          -1.0
        </span>
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#64748b", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }} />
          0.0
        </span>
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#2563eb", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }} />
          +1.0
        </span>
      </div>
    </div>
  );
}

function corrColor(value: number): string {
  if (value >= 0.8) return "#1d4ed8";
  if (value >= 0.6) return "#2563eb";
  if (value >= 0.4) return "#3b82f6";
  if (value >= 0.2) return "#60a5fa88";
  if (value >= 0) return "#64748b44";
  if (value >= -0.2) return "#f59e0b44";
  if (value >= -0.4) return "#f97316aa";
  if (value >= -0.6) return "#ef4444aa";
  if (value >= -0.8) return "#dc2626";
  return "#991b1b";
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}
