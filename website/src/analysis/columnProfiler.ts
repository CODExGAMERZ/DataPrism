import type { ColumnProfile, ColumnInfo } from "../types";
import { inferColumnType, hasMixedTypes } from "./typeInference";
import {
  computeNumericStats,
  computeCategoricalStats,
  computeDatetimeStats,
  extractNumericValues,
  extractStringValues,
} from "./statsEngine";

export function profileColumns(
  headers: string[],
  rows: Record<string, unknown>[]
): ColumnProfile[] {
  return headers.map((name) => profileColumn(name, rows));
}

function profileColumn(name: string, rows: Record<string, unknown>[]): ColumnProfile {
  const values = rows.map((r) => r[name]);
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  const type = inferColumnType(values);
  const mixed = hasMixedTypes(values);

  const info: ColumnInfo = {
    name,
    type,
    nullCount: values.length - nonNull.length,
    nullPercentage: values.length > 0 ? Math.round(((values.length - nonNull.length) / values.length) * 10000) / 100 : 0,
    uniqueCount: new Set(nonNull.map((v) => JSON.stringify(v))).size,
    totalCount: values.length,
    sampleValues: nonNull.slice(0, 5),
    hasMixedTypes: mixed,
  };

  const profile: ColumnProfile = { info };

  if (type === "numeric" || type === "mixed") {
    const nums = extractNumericValues(values);
    if (nums.length > 0) {
      profile.numericStats = computeNumericStats(nums);
      profile.suggestion = generateNumericSuggestion(profile.numericStats.skewness, name);
    }
  }

  if (type === "categorical" || type === "mixed") {
    const strs = extractStringValues(nonNull);
    if (strs.length > 0) {
      profile.categoricalStats = computeCategoricalStats(strs);
      if (!profile.suggestion) {
        profile.suggestion = generateCategoricalSuggestion(profile.categoricalStats, info);
      }
    }
  }

  if (type === "datetime") {
    const strs = nonNull.map((v) => String(v));
    profile.datetimeStats = computeDatetimeStats(strs);
  }

  if (type === "boolean") {
    profile.categoricalStats = computeCategoricalStats(nonNull);
  }

  if (mixed) {
    profile.suggestion = `Mixed types detected — consider cleaning or splitting column "${name}".`;
  }

  return profile;
}

function generateNumericSuggestion(skewness: number, name: string): string | undefined {
  if (Math.abs(skewness) > 2) {
    return `High skew (${skewness > 0 ? "right" : "left"}) — consider log transform for "${name}".`;
  }
  if (Math.abs(skewness) > 1) {
    return `Moderate skew detected in "${name}" — may benefit from normalization.`;
  }
  return undefined;
}

function generateCategoricalSuggestion(stats: ReturnType<typeof computeCategoricalStats>, info: ColumnInfo): string | undefined {
  if (info.uniqueCount === info.totalCount - info.nullCount) {
    return `All values are unique — "${info.name}" may be an identifier column.`;
  }
  if (stats.topPercentage > 90) {
    return `"${info.name}" is dominated by "${stats.topValue}" (${stats.topPercentage}%) — low variance.`;
  }
  if (info.uniqueCount > 100) {
    return `High cardinality (${info.uniqueCount} unique values) — consider binning or encoding.`;
  }
  return undefined;
}
