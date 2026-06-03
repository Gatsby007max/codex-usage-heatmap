import { scanUsage } from "../core/scan.js";
import type { DailyUsage, ScanSummary } from "../types.js";
import { scanOptionsFromCommand } from "./shared.js";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function renderHumanScanSummary(summary: ScanSummary, days: DailyUsage[]): string {
  const totalTokens = days.reduce((acc, day) => acc + day.totalTokens, 0);
  const lines = [
    "Codex Usage Heatmap Scan",
    `Checked paths: ${formatNumber(summary.checkedPaths)}`,
    `Found JSONL files: ${formatNumber(summary.foundJsonlFiles)}`,
    `Skipped sensitive files: ${formatNumber(summary.skippedSensitiveFiles)}`,
    `Readable files: ${formatNumber(summary.readableFiles)}`,
    `Parsed lines: ${formatNumber(summary.parsedLines)}`,
    `Malformed lines: ${formatNumber(summary.malformedLines)}`,
    `Usage events: ${formatNumber(summary.recognizedUsageEvents)}`,
    `Skipped records: ${formatNumber(summary.skippedEvents)}`,
    `Active days: ${formatNumber(days.length)}`,
    `Total tokens: ${formatNumber(totalTokens)}`
  ];

  if (summary.warnings.length) {
    lines.push("Warnings:");
    for (const warning of [...new Set(summary.warnings)]) {
      lines.push(`- ${warning}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function runScanCommand(options: Record<string, unknown>): Promise<void> {
  const result = await scanUsage(scanOptionsFromCommand(options));
  if (options.json) {
    process.stdout.write(
      `${JSON.stringify({ summary: result.summary, dailyUsage: result.dailyUsage }, null, 2)}\n`
    );
    return;
  }

  process.stdout.write(renderHumanScanSummary(result.summary, result.dailyUsage));
}
