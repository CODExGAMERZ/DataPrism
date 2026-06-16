import type { FileMetadata, PreviewData, ColumnType } from "../types";
import { inferColumnType } from "./typeInference";

interface ParseResult {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRowCount: number;
  sampled: boolean;
  encodingUsed: string;
  flatteningApplied: boolean;
}

export function detectFileType(fileName: string): "csv" | "json" | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "json") return "json";
  return null;
}

export function parseFile(fileName: string, content: string, sampleSize?: number): ParseResult {
  const fileType = detectFileType(fileName);
  if (!fileType) throw new Error(`Unsupported file type: ${fileName}`);
  if (fileType === "csv") return parseCsv(content, sampleSize);
  return parseJson(content, sampleSize);
}

export function buildMetadata(fileName: string, fileSize: number, result: ParseResult): FileMetadata {
  const roughMemory = JSON.stringify(result.rows.slice(0, 100)).length * (result.totalRowCount / Math.min(100, result.totalRowCount));

  return {
    fileName: fileName,
    fileType: detectFileType(fileName)!,
    rows: result.totalRowCount,
    cols: result.headers.length,
    sizeBytes: fileSize,
    memoryUsageMB: Math.round((roughMemory / 1024 / 1024) * 100) / 100,
    sampled: result.sampled,
    sampledRows: result.sampled ? result.rows.length : undefined,
    encodingUsed: result.encodingUsed,
    flatteningApplied: result.flatteningApplied,
  };
}

export function buildPreview(result: ParseResult, maxRows: number = 100): PreviewData {
  const previewRows = result.rows.slice(0, maxRows);
  const columns = result.headers.map((name) => {
    const values = previewRows.map((r) => r[name]);
    return { name, type: inferColumnType(values) as ColumnType };
  });
  return { columns, rows: previewRows };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(content: string, sampleSize?: number): ParseResult {
  if (content.trim().length === 0) {
    return { headers: [], rows: [], totalRowCount: 0, sampled: false, encodingUsed: "utf-8", flatteningApplied: false };
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRowCount: 0, sampled: false, encodingUsed: "utf-8", flatteningApplied: false };
  }

  const firstLine = parseCsvLine(lines[0]);
  const isHeader = firstLine.every((f) => isNaN(Number(f)) || f.trim().length === 0);
  const headers = isHeader
    ? firstLine.map((h, i) => h.trim() || `Column_${i + 1}`)
    : firstLine.map((_, i) => `Column_${i + 1}`);

  const dataStart = isHeader ? 1 : 0;
  const totalRowCount = lines.length - dataStart;
  const sampled = sampleSize !== undefined && totalRowCount > sampleSize;
  const step = sampled ? Math.floor(totalRowCount / sampleSize) : 1;

  const rows: Record<string, unknown>[] = [];
  for (let i = dataStart; i < lines.length; i += step) {
    if (sampled && rows.length >= sampleSize) break;
    const fields = parseCsvLine(lines[i]);
    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const raw = fields[j]?.trim();
      row[headers[j]] = raw === undefined || raw === "" ? null : parseValue(raw);
    }
    rows.push(row);
  }

  return { headers, rows, totalRowCount, sampled, encodingUsed: "utf-8", flatteningApplied: false };
}

function parseJson(content: string, sampleSize?: number): ParseResult {
  if (content.trim().length === 0) {
    return { headers: [], rows: [], totalRowCount: 0, sampled: false, encodingUsed: "utf-8", flatteningApplied: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${(e as Error).message}`);
  }

  let records: Record<string, unknown>[];
  let flatteningApplied = false;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { headers: [], rows: [], totalRowCount: 0, sampled: false, encodingUsed: "utf-8", flatteningApplied: false };
    }

    if (typeof parsed[0] !== "object" || parsed[0] === null) {
      records = parsed.map((v, i) => ({ index: i, value: v }));
    } else {
      const { rows, didFlatten } = flattenRecords(parsed as Record<string, unknown>[]);
      records = rows;
      flatteningApplied = didFlatten;
    }
  } else if (typeof parsed === "object" && parsed !== null) {
    const { rows, didFlatten } = flattenRecords([parsed as Record<string, unknown>]);
    records = rows;
    flatteningApplied = didFlatten;
  } else {
    records = [{ value: parsed }];
  }

  const totalRowCount = records.length;
  const sampled = sampleSize !== undefined && totalRowCount > sampleSize;
  const step = sampled ? Math.floor(totalRowCount / sampleSize) : 1;
  const sampledRecords: Record<string, unknown>[] = [];

  for (let i = 0; i < records.length; i += step) {
    if (sampled && sampledRecords.length >= sampleSize) break;
    sampledRecords.push(records[i]);
  }

  const headerSet = new Set<string>();
  sampledRecords.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const rows = sampledRecords.map((r) => {
    const row: Record<string, unknown> = {};
    for (const h of headers) {
      row[h] = r[h] === undefined ? null : r[h];
    }
    return row;
  });

  return { headers, rows, totalRowCount, sampled, encodingUsed: "utf-8", flatteningApplied };
}

function flattenRecords(records: Record<string, unknown>[]): { rows: Record<string, unknown>[]; didFlatten: boolean } {
  let didFlatten = false;
  const rows = records.map((record) => {
    const flat: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        didFlatten = true;
        for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
          if (subValue !== null && typeof subValue === "object") {
            flat[`${key}.${subKey}`] = JSON.stringify(subValue);
          } else {
            flat[`${key}.${subKey}`] = subValue;
          }
        }
      } else if (Array.isArray(value)) {
        flat[key] = JSON.stringify(value);
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });
  return { rows, didFlatten };
}

function parseValue(raw: string): unknown {
  if (raw.toLowerCase() === "true") return true;
  if (raw.toLowerCase() === "false") return false;
  if (raw.toLowerCase() === "null" || raw.toLowerCase() === "na" || raw.toLowerCase() === "n/a") return null;

  const num = Number(raw);
  if (!isNaN(num) && raw.trim().length > 0) return num;

  const dateMs = Date.parse(raw);
  if (!isNaN(dateMs) && raw.length >= 8 && /[\/\-]/.test(raw)) {
    return new Date(dateMs).toISOString();
  }

  return raw;
}
