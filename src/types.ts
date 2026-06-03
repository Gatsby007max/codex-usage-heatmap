export type EstimationMode =
  | "none"
  | "total_delta"
  | "total_as_event"
  | "file_mtime"
  | "unknown_timestamp";

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;
export type LevelBasis = "quantile" | "fixed";
export type UsageMetric = "total" | "input" | "output" | "cached" | "reasoning";
export type ThemeName = "github" | "dark" | "blue" | "gray";
export type WeekStart = "sunday" | "monday";

export interface TokenUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
}

export interface NormalizedUsageEvent extends TokenUsage {
  id: string;
  sourceFile?: string;
  sourceLine?: number;
  timestamp: string;
  date: string;
  timezone: string;
  model?: string;
  sessionId?: string;
  rawKind: string;
  parserVersion: string;
  estimationMode: EstimationMode;
}

export interface DailyUsage extends TokenUsage {
  date: string;
  eventCount: number;
  sessionCount: number;
  filesCount: number;
  level: HeatmapLevel;
  levelBasis: LevelBasis;
}

export interface ScanSummary {
  checkedPaths: number;
  foundJsonlFiles: number;
  skippedSensitiveFiles: number;
  readableFiles: number;
  parsedLines: number;
  malformedLines: number;
  recognizedUsageEvents: number;
  skippedEvents: number;
  warnings: string[];
}

export interface ParserContext {
  sourceFile: string;
  sourceLine: number;
  fileMtime?: Date;
}

export interface ParsedUsageCandidate {
  timestamp?: string;
  model?: string;
  sessionId?: string;
  usage: TokenUsage;
  usageKind: "event" | "total";
  rawKind: string;
  parserName: string;
  parserVersion: string;
}

export interface UsageParser {
  name: string;
  version: string;
  canParse(record: unknown): boolean;
  parse(record: unknown, context: ParserContext): ParsedUsageCandidate[];
}

export interface DiscoveredFile {
  path: string;
  size: number;
  mtime: Date;
}

export interface DiscoveryResult {
  checkedPaths: number;
  files: DiscoveredFile[];
  foundJsonlFiles: number;
  skippedSensitiveFiles: number;
  readableFiles: number;
  warnings: string[];
}

export interface ScanOptions {
  source?: string;
  since?: string;
  until?: string;
  timezone?: string;
  includePaths?: boolean;
  maxFileSizeMb?: number;
  weekStart?: WeekStart;
  cache?: string;
  levelMode?: LevelBasis;
  levelFixed?: string;
}

export interface ScanResult {
  summary: ScanSummary;
  events: NormalizedUsageEvent[];
  dailyUsage: DailyUsage[];
}

export interface RenderOptions {
  title?: string;
  year?: number;
  theme?: ThemeName;
  metric?: UsageMetric;
  weekStart?: WeekStart;
  generatedAt?: string;
}

export interface ReportOutput {
  html: string;
  svg: string;
  json: string;
  csv: string;
}
