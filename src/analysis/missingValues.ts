import type { MissingValueSummary } from "../types/dataset";

export function analyzeMissingValues(
  headers: string[],
  rows: Record<string, unknown>[]
): MissingValueSummary {
  const totalCells = headers.length * rows.length;
  let totalMissing = 0;

  const columns = headers.map((name) => {
    let missing = 0;
    for (const row of rows) {
      const val = row[name];
      if (val === null || val === undefined || val === "" || (typeof val === "number" && isNaN(val))) {
        missing++;
      }
    }
    totalMissing += missing;
    return {
      name,
      missing,
      percentage: rows.length > 0 ? Math.round((missing / rows.length) * 10000) / 100 : 0,
    };
  });

  columns.sort((a, b) => b.percentage - a.percentage);

  return {
    totalMissing,
    totalCells,
    overallPercentage: totalCells > 0 ? Math.round((totalMissing / totalCells) * 10000) / 100 : 0,
    columns,
  };
}
