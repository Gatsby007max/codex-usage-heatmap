import type { DailyUsage } from "../types.js";

const columns: Array<keyof DailyUsage> = [
  "date",
  "inputTokens",
  "cachedInputTokens",
  "outputTokens",
  "reasoningOutputTokens",
  "totalTokens",
  "eventCount",
  "sessionCount",
  "filesCount",
  "level",
  "levelBasis"
];

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function exportCsv(days: DailyUsage[]): string {
  const rows = [
    columns.join(","),
    ...days.map((day) => columns.map((column) => escapeCsv(day[column])).join(","))
  ];
  return `${rows.join("\n")}\n`;
}
