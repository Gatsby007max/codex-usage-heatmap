import type { ThemeName, UsageMetric, WeekStart } from "../types.js";

export const DEFAULT_MAX_FILE_SIZE_MB = 25;
export const DEFAULT_REPORT_DIR = "codex-usage-report";
export const DEFAULT_TIMEZONE = "local";
export const DEFAULT_WEEK_START: WeekStart = "sunday";
export const DEFAULT_THEME: ThemeName = "github";
export const DEFAULT_METRIC: UsageMetric = "total";
export const DEFAULT_LEVEL_FIXED = "1000,10000,100000,1000000";
export const SUSPICIOUS_TOKEN_DELTA = 10_000_000;
export const PRIVACY_NOTICE =
  "This report was generated locally. It does not include prompts, responses, credentials, or raw logs.";
export const LIMITATION_NOTICE =
  "This tool is not an official billing, quota, or account usage source. It only visualizes token usage inferred from local Codex logs.";
