import type { CorrelationMatrix } from "../types/dataset";
import { extractNumericValues } from "./statsEngine";

export function computeCorrelation(
  headers: string[],
  rows: Record<string, unknown>[],
  method: "pearson" | "spearman" = "pearson"
): CorrelationMatrix | null {
  const numericCols: { name: string; values: number[] }[] = [];

  for (const header of headers) {
    const raw = rows.map((r) => r[header]);
    const nums = extractNumericValues(raw);
    if (nums.length >= rows.length * 0.5) {
      const aligned = rows.map((r) => {
        const v = r[header];
        if (v === null || v === undefined) return NaN;
        if (typeof v === "number") return isFinite(v) ? v : NaN;
        if (typeof v === "boolean") return v ? 1 : 0;
        if (typeof v === "string") {
          const n = Number(v);
          return isFinite(n) ? n : NaN;
        }
        return NaN;
      });
      numericCols.push({ name: header, values: aligned });
    }
  }

  if (numericCols.length < 2) return null;

  const warning = numericCols.length > 50
    ? `Large correlation matrix: ${numericCols.length} numeric columns detected. Consider filtering.`
    : undefined;

  const labels = numericCols.map((c) => c.name);
  const n = numericCols.length;
  const values: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    values[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const r =
        method === "pearson"
          ? pearson(numericCols[i].values, numericCols[j].values)
          : spearman(numericCols[i].values, numericCols[j].values);
      values[i][j] = r;
      values[j][i] = r;
    }
  }

  return { labels, values, method, warning };
}

function pearson(x: number[], y: number[]): number {
  const pairs: [number, number][] = [];
  for (let i = 0; i < x.length; i++) {
    if (!isNaN(x[i]) && !isNaN(y[i])) pairs.push([x[i], y[i]]);
  }

  if (pairs.length < 3) return 0;

  const n = pairs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const [xi, yi] of pairs) {
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

function spearman(x: number[], y: number[]): number {
  const pairs: [number, number][] = [];
  for (let i = 0; i < x.length; i++) {
    if (!isNaN(x[i]) && !isNaN(y[i])) pairs.push([x[i], y[i]]);
  }

  if (pairs.length < 3) return 0;

  const rankX = computeRanks(pairs.map((p) => p[0]));
  const rankY = computeRanks(pairs.map((p) => p[1]));

  return pearson(rankX, rankY);
}

function computeRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avgRank = (i + j - 1) / 2 + 1;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}
