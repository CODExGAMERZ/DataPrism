import type { NumericStats, CategoricalStats, DatetimeStats } from "../types/dataset";

export function computeNumericStats(values: number[]): NumericStats {
  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return { count: 0, mean: 0, median: 0, stdDev: 0, min: 0, max: 0, q25: 0, q50: 0, q75: 0, skewness: 0 };
  }

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const median = percentile(sorted, 50);
  const q25 = percentile(sorted, 25);
  const q75 = percentile(sorted, 75);

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  let skewness = 0;
  if (stdDev > 0 && n >= 3) {
    const m3 = sorted.reduce((acc, v) => acc + ((v - mean) / stdDev) ** 3, 0) / n;
    skewness = m3;
  }

  return {
    count: n,
    mean: round(mean),
    median: round(median),
    stdDev: round(stdDev),
    min: sorted[0],
    max: sorted[n - 1],
    q25: round(q25),
    q50: round(median),
    q75: round(q75),
    skewness: round(skewness),
  };
}

export function computeCategoricalStats(values: unknown[], topN: number = 10): CategoricalStats {
  const freq = new Map<string, number>();
  for (const v of values) {
    const key = String(v);
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const total = values.length;
  const topValue = sorted.length > 0 ? sorted[0][0] : "";
  const topFrequency = sorted.length > 0 ? sorted[0][1] : 0;

  return {
    uniqueCount: freq.size,
    topValue,
    topFrequency,
    topPercentage: total > 0 ? round((topFrequency / total) * 100) : 0,
    distribution: sorted.slice(0, topN).map(([value, count]) => ({
      value,
      count,
      percentage: round((count / total) * 100),
    })),
  };
}

export function computeDatetimeStats(values: string[]): DatetimeStats {
  const timestamps = values
    .map((v) => Date.parse(v))
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  if (timestamps.length === 0) {
    return { minDate: "", maxDate: "", rangeDays: 0, missingCount: values.length };
  }

  const minDate = new Date(timestamps[0]).toISOString().split("T")[0];
  const maxDate = new Date(timestamps[timestamps.length - 1]).toISOString().split("T")[0];
  const rangeDays = Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24));
  const missingCount = values.length - timestamps.length;

  return { minDate, maxDate, rangeDays, missingCount };
}

export function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  if (sortedArr.length === 1) return sortedArr[0];

  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sortedArr[lower];

  const weight = index - lower;
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

function round(value: number, decimals: number = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function extractNumericValues(values: unknown[]): number[] {
  return values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => (typeof v === "string" ? Number(v) : v))
    .filter((v) => typeof v === "number" && isFinite(v)) as number[];
}

export function extractStringValues(values: unknown[]): string[] {
  return values.filter((v) => v !== null && v !== undefined).map((v) => String(v));
}
