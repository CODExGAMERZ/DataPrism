import type { OutlierResult } from "../types/dataset";
import { extractNumericValues, computeNumericStats } from "./statsEngine";

export function detectOutliers(
  headers: string[],
  rows: Record<string, unknown>[]
): OutlierResult[] {
  const results: OutlierResult[] = [];

  for (const header of headers) {
    const raw = rows.map((r) => r[header]);
    const values = extractNumericValues(raw);
    if (values.length < 10) continue;

    const iqrResult = detectIQR(header, values, rows);
    if (iqrResult) results.push(iqrResult);
  }

  return results;
}

function detectIQR(
  column: string,
  values: number[],
  rows: Record<string, unknown>[]
): OutlierResult | null {
  const stats = computeNumericStats(values);
  const iqr = stats.q75 - stats.q25;

  if (iqr === 0) return null;

  const lowerBound = stats.q25 - 1.5 * iqr;
  const upperBound = stats.q75 + 1.5 * iqr;

  const extremes: { value: number; index: number }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const val = rows[i][column];
    if (val === null || val === undefined) continue;
    const num = typeof val === "string" ? Number(val) : (val as number);
    if (!isFinite(num)) continue;

    if (num < lowerBound || num > upperBound) {
      extremes.push({ value: num, index: i });
    }
  }

  if (extremes.length === 0) return null;

  extremes.sort((a, b) => Math.abs(b.value - stats.median) - Math.abs(a.value - stats.median));

  return {
    column,
    method: "IQR",
    outlierCount: extremes.length,
    outlierPercentage: Math.round((extremes.length / values.length) * 10000) / 100,
    extremeValues: extremes.slice(0, 5),
  };
}
