import type { DuplicateSummary } from "../types";

export function analyzeDuplicates(rows: Record<string, unknown>[]): DuplicateSummary {
  if (rows.length === 0) {
    return { totalDuplicates: 0, duplicatePercentage: 0, duplicateIndices: [] };
  }

  const seen = new Map<string, number>();
  const duplicateIndices: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const key = JSON.stringify(rows[i]);
    const firstSeen = seen.get(key);
    if (firstSeen !== undefined) {
      duplicateIndices.push(i);
    } else {
      seen.set(key, i);
    }
  }

  return {
    totalDuplicates: duplicateIndices.length,
    duplicatePercentage: Math.round((duplicateIndices.length / rows.length) * 10000) / 100,
    duplicateIndices: duplicateIndices.slice(0, 100),
  };
}
