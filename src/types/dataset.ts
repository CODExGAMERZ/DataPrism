export type ColumnType = "numeric" | "categorical" | "datetime" | "boolean" | "mixed" | "empty";

export interface FileMetadata {
  fileName: string;
  fileType: "csv" | "json";
  rows: number;
  cols: number;
  sizeBytes: number;
  memoryUsageMB: number;
  sampled: boolean;
  sampledRows?: number;
  encodingUsed?: string;
  flatteningApplied?: boolean;
}

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  totalCount: number;
  sampleValues: unknown[];
  hasMixedTypes: boolean;
}

export interface NumericStats {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q25: number;
  q50: number;
  q75: number;
  skewness: number;
}

export interface CategoricalStats {
  uniqueCount: number;
  topValue: string;
  topFrequency: number;
  topPercentage: number;
  distribution: { value: string; count: number; percentage: number }[];
}

export interface DatetimeStats {
  minDate: string;
  maxDate: string;
  rangeDays: number;
  missingCount: number;
}

export interface ColumnProfile {
  info: ColumnInfo;
  numericStats?: NumericStats;
  categoricalStats?: CategoricalStats;
  datetimeStats?: DatetimeStats;
  suggestion?: string;
}

export interface MissingValueSummary {
  totalMissing: number;
  totalCells: number;
  overallPercentage: number;
  columns: { name: string; missing: number; percentage: number }[];
}

export interface DuplicateSummary {
  totalDuplicates: number;
  duplicatePercentage: number;
  duplicateIndices: number[];
}

export interface CorrelationMatrix {
  labels: string[];
  values: number[][];
  method: "pearson" | "spearman";
  warning?: string;
}

export interface OutlierResult {
  column: string;
  method: string;
  outlierCount: number;
  outlierPercentage: number;
  extremeValues: { value: number; index: number }[];
}

export interface QualityPenalty {
  factor: string;
  penalty: number;
  maxPenalty: number;
  detail: string;
}

export interface QualityScore {
  score: number;
  penalties: QualityPenalty[];
  summary: string;
}

export interface PreviewData {
  columns: { name: string; type: ColumnType }[];
  rows: Record<string, unknown>[];
}

export interface FeatureSuggestion {
  column: string;
  type: string;
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
}

export interface MissingValueRecommendation {
  column: string;
  missingCount: number;
  percentage: number;
  recommendation: string;
  strategy: string;
  codeSnippet: string;
}

export interface CompetitionLeakage {
  column: string;
  reason: string;
  severity: "High" | "Medium";
}

export interface CompetitionModelSuggestion {
  model: string;
  suitability: "High" | "Medium" | "Low";
  reason: string;
}

export interface CompetitionInsights {
  targetColumnSuggestion: string;
  targetLeakageAlerts: CompetitionLeakage[];
  validationStrategy: string;
  validationDetails: string;
  modelSuggestions: CompetitionModelSuggestion[];
  metricSuggestions: string[];
}

export interface PlainTextSummary {
  description: string;
  assumedTask: string;
  keyPredictors: string[];
  qualityIssuesCount: number;
  mlSuitability: string;
}

export interface DatasetProfile {
  metadata: FileMetadata;
  preview: PreviewData;
  columns: ColumnProfile[];
  missing: MissingValueSummary;
  duplicates: DuplicateSummary;
  correlation: CorrelationMatrix | null;
  outliers: OutlierResult[];
  quality: QualityScore;
  insights?: {
    summary: PlainTextSummary;
    features: FeatureSuggestion[];
    missing: MissingValueRecommendation[];
    competition: CompetitionInsights;
  };
}
