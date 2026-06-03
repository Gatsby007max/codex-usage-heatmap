import { LIMITATION_NOTICE, PRIVACY_NOTICE } from "../config/defaults.js";
import { exportCsv } from "../exporters/csv.js";
import { exportJson } from "../exporters/json.js";
import type { DailyUsage, ReportOutput, RenderOptions } from "../types.js";
import { renderCss } from "./css.js";
import { renderHeatmapSvg } from "./heatmapSvg.js";
import { getTheme } from "./themes.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function totals(days: DailyUsage[]) {
  return days.reduce(
    (acc, day) => ({
      inputTokens: acc.inputTokens + day.inputTokens,
      cachedInputTokens: acc.cachedInputTokens + day.cachedInputTokens,
      outputTokens: acc.outputTokens + day.outputTokens,
      reasoningOutputTokens: acc.reasoningOutputTokens + day.reasoningOutputTokens,
      totalTokens: acc.totalTokens + day.totalTokens,
      events: acc.events + day.eventCount
    }),
    {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0,
      events: 0
    }
  );
}

function summaryCard(label: string, value: string): string {
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function topDays(days: DailyUsage[]): DailyUsage[] {
  return [...days].sort((a, b) => b.totalTokens - a.totalTokens || a.date.localeCompare(b.date)).slice(0, 10);
}

function last30(days: DailyUsage[]): DailyUsage[] {
  return [...days].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).reverse();
}

function usageTable(days: DailyUsage[]): string {
  const rows = days
    .map(
      (day) =>
        `<tr><td>${day.date}</td><td>${formatNumber(day.totalTokens)}</td><td>${formatNumber(day.eventCount)}</td><td>${day.level}</td></tr>`
    )
    .join("");
  return `<table><thead><tr><th>Date</th><th>Total tokens</th><th>Events</th><th>Level</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function renderHtmlReport(days: DailyUsage[], options: RenderOptions = {}): ReportOutput {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const theme = getTheme(options.theme ?? "github");
  const svg = renderHeatmapSvg(days, options);
  const sum = totals(days);
  const activeDays = days.filter((day) => day.totalTokens > 0).length;
  const dateRange = days.length ? `${days[0]?.date} to ${days.at(-1)?.date}` : "No usage data";
  const last30Total = last30(days).reduce((acc, day) => acc + day.totalTokens, 0);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Codex Usage Heatmap</title>
<style>${renderCss(theme)}</style>
</head>
<body>
<main>
<h1>Codex Usage Heatmap</h1>
<p class="subtitle">Local-only token usage visualization for Codex logs.</p>
<section class="summary" aria-label="Usage summary">
${summaryCard("Total tokens", formatNumber(sum.totalTokens))}
${summaryCard("Input tokens", formatNumber(sum.inputTokens))}
${summaryCard("Cached input tokens", formatNumber(sum.cachedInputTokens))}
${summaryCard("Output tokens", formatNumber(sum.outputTokens))}
${summaryCard("Reasoning output tokens", formatNumber(sum.reasoningOutputTokens))}
${summaryCard("Events", formatNumber(sum.events))}
${summaryCard("Active days", formatNumber(activeDays))}
${summaryCard("Date range", dateRange)}
</section>
<section>
<h2>Heatmap</h2>
<div class="heatmap">${svg}</div>
</section>
<section>
<h2>Top 10 Usage Days</h2>
${usageTable(topDays(days))}
</section>
<section>
<h2>Last 30 Days Summary</h2>
<p>Total tokens in the latest 30 active records: ${formatNumber(last30Total)}.</p>
${usageTable(last30(days))}
</section>
<section class="sr-summary">
<h2>Fallback Table Summary</h2>
${usageTable(days)}
</section>
<section>
<h2>Privacy Notice</h2>
<p class="notice">${escapeHtml(PRIVACY_NOTICE)}</p>
</section>
<section>
<h2>Limitations</h2>
<p class="notice">${escapeHtml(LIMITATION_NOTICE)}</p>
</section>
<p class="muted">Generated at ${escapeHtml(generatedAt)}.</p>
<p class="muted">Command hint: <code>cuh report --out ./codex-usage-report</code></p>
</main>
</body>
</html>`;

  return {
    html,
    svg,
    json: exportJson(days, true),
    csv: exportCsv(days)
  };
}
