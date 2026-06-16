import type { ColumnType } from "../types";

export function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined);
  if (nonNull.length === 0) return "empty";

  let numericCount = 0;
  let booleanCount = 0;
  let dateCount = 0;
  let stringCount = 0;

  for (const val of nonNull) {
    if (typeof val === "boolean") {
      booleanCount++;
    } else if (typeof val === "number" && isFinite(val)) {
      numericCount++;
    } else if (typeof val === "string") {
      if (isDateString(val)) {
        dateCount++;
      } else if (isNumericString(val)) {
        numericCount++;
      } else {
        stringCount++;
      }
    } else {
      stringCount++;
    }
  }

  const total = nonNull.length;
  const threshold = 0.8;

  if (booleanCount / total >= threshold) return "boolean";
  if (numericCount / total >= threshold) return "numeric";
  if (dateCount / total >= threshold) return "datetime";

  const dominantCount = Math.max(numericCount, booleanCount, dateCount, stringCount);
  if (dominantCount === stringCount) return "categorical";

  if ((numericCount + stringCount) === total && numericCount > 0 && stringCount > 0) return "mixed";

  return "categorical";
}

export function hasMixedTypes(values: unknown[]): boolean {
  return inferColumnType(values) === "mixed";
}

function isNumericString(val: string): boolean {
  if (val.trim().length === 0) return false;
  return !isNaN(Number(val));
}

function isDateString(val: string): boolean {
  if (val.length < 8) return false;
  if (!/[\-\/]/.test(val)) return false;
  const parsed = Date.parse(val);
  return !isNaN(parsed);
}
