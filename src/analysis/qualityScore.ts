import type { QualityScore, QualityPenalty, MissingValueSummary, DuplicateSummary, OutlierResult, ColumnProfile } from "../types/dataset";

export function computeQualityScore(
  missing: MissingValueSummary,
  duplicates: DuplicateSummary,
  outliers: OutlierResult[],
  columns: ColumnProfile[],
  rows: Record<string, unknown>[]
): QualityScore {
  const penalties: QualityPenalty[] = [];

  penalties.push(computeMissingPenalty(missing));
  penalties.push(computeDuplicatePenalty(duplicates));
  penalties.push(computeOutlierPenalty(outliers));
  penalties.push(computeInvalidTypePenalty(columns));
  penalties.push(computeCategoryInconsistencyPenalty(columns, rows));

  const totalPenalty = penalties.reduce((sum, p) => sum + p.penalty, 0);
  const score = Math.max(0, 100 - totalPenalty);

  const deductions = penalties.filter((p) => p.penalty > 0).map((p) => p.detail);
  const summary = deductions.length > 0
    ? `Deductions: ${deductions.join("; ")}`
    : "No quality issues detected.";

  return { score, penalties, summary };
}

function computeMissingPenalty(missing: MissingValueSummary): QualityPenalty {
  const pct = missing.overallPercentage;
  let penalty = 0;

  if (pct <= 5) {
    penalty = 0;
  } else if (pct <= 20) {
    penalty = ((pct - 5) / 15) * 15;
  } else {
    penalty = 25;
  }

  penalty = Math.round(penalty * 100) / 100;

  return {
    factor: "Missing Values",
    penalty,
    maxPenalty: 25,
    detail: penalty > 0 ? `${missing.overallPercentage}% missing (−${penalty})` : "No significant missing data",
  };
}

function computeDuplicatePenalty(duplicates: DuplicateSummary): QualityPenalty {
  const pct = duplicates.duplicatePercentage;
  let penalty = 0;

  if (pct <= 1) {
    penalty = 0;
  } else if (pct <= 5) {
    penalty = ((pct - 1) / 4) * 10;
  } else {
    penalty = 20;
  }

  penalty = Math.round(penalty * 100) / 100;

  return {
    factor: "Duplicate Rows",
    penalty,
    maxPenalty: 20,
    detail: penalty > 0 ? `${duplicates.duplicatePercentage}% duplicates (−${penalty})` : "No significant duplicates",
  };
}

function computeOutlierPenalty(outliers: OutlierResult[]): QualityPenalty {
  if (outliers.length === 0) {
    return { factor: "Outliers", penalty: 0, maxPenalty: 20, detail: "No outliers detected" };
  }

  const avgPct = outliers.reduce((s, o) => s + o.outlierPercentage, 0) / outliers.length;
  let penalty = 0;

  if (avgPct < 1) {
    penalty = 0;
  } else if (avgPct <= 5) {
    penalty = ((avgPct - 1) / 4) * 10;
  } else {
    penalty = 20;
  }

  penalty = Math.round(penalty * 100) / 100;

  const totalOutliers = outliers.reduce((s, o) => s + o.outlierCount, 0);
  return {
    factor: "Outliers",
    penalty,
    maxPenalty: 20,
    detail: penalty > 0 ? `${totalOutliers} outliers across ${outliers.length} columns (−${penalty})` : "Outlier rate within normal range",
  };
}

function computeInvalidTypePenalty(columns: ColumnProfile[]): QualityPenalty {
  const mixedCols = columns.filter((c) => c.info.hasMixedTypes);
  const penalty = Math.min(mixedCols.length * 5, 15);

  return {
    factor: "Invalid/Mixed Types",
    penalty,
    maxPenalty: 15,
    detail: penalty > 0 ? `${mixedCols.length} column(s) with mixed types (−${penalty})` : "All columns have consistent types",
  };
}

function computeCategoryInconsistencyPenalty(
  columns: ColumnProfile[],
  rows: Record<string, unknown>[]
): QualityPenalty {
  let inconsistentCols = 0;

  for (const col of columns) {
    if (col.info.type !== "categorical") continue;

    const values = rows
      .map((r) => r[col.info.name])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v));

    const normalized = new Map<string, Set<string>>();
    for (const val of values) {
      const key = val.trim().toLowerCase();
      if (!normalized.has(key)) normalized.set(key, new Set());
      normalized.get(key)!.add(val);
    }

    const hasVariants = Array.from(normalized.values()).some((variants) => variants.size > 1);
    const hasWhitespace = values.some((v) => v !== v.trim());

    if (hasVariants || hasWhitespace) inconsistentCols++;
  }

  const penalty = Math.min(inconsistentCols * 5, 20);

  return {
    factor: "Category Inconsistency",
    penalty,
    maxPenalty: 20,
    detail: penalty > 0
      ? `${inconsistentCols} column(s) with case variants or whitespace issues (−${penalty})`
      : "No category inconsistencies detected",
  };
}
