import type { DailyUsage } from "../types.js";

const columns: Array<keyof Omit<DailyUsage, "featureCounts">> = [
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
  const header = [...columns, "features"];
  const rows = [
    header.join(","),
    ...days.map((day) => {
      const featureSummary = Object.entries(day.featureCounts ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([feature, count]) => `${feature}:${count}`)
        .join("; ");
      return [...columns.map((column) => escapeCsv(day[column])), escapeCsv(featureSummary)].join(",");
    })
  ];
  return `${rows.join("\n")}\n`;
}
