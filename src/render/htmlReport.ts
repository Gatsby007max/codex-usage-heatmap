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

interface FeatureTotal {
  feature: string;
  count: number;
}

interface StreakStats {
  current: number;
  longest: number;
}

function topDays(days: DailyUsage[]): DailyUsage[] {
  return [...days].sort((a, b) => b.totalTokens - a.totalTokens || a.date.localeCompare(b.date)).slice(0, 10);
}

function last30(days: DailyUsage[]): DailyUsage[] {
  return [...days].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).reverse();
}

function dateMs(date: string): number | undefined {
  const value = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isFinite(value) ? value : undefined;
}

function streakStats(days: DailyUsage[]): StreakStats {
  const dayMs = 86_400_000;
  const ordered = days
    .map((day) => ({ ...day, ms: dateMs(day.date) }))
    .filter((day): day is DailyUsage & { ms: number } => day.ms !== undefined)
    .sort((a, b) => a.ms - b.ms);

  let currentRun = 0;
  let longest = 0;
  let previousActiveMs: number | undefined;
  let latestActiveRun = 0;

  for (const day of ordered) {
    if (day.totalTokens <= 0) {
      currentRun = 0;
      previousActiveMs = undefined;
      continue;
    }

    currentRun = previousActiveMs !== undefined && day.ms - previousActiveMs === dayMs ? currentRun + 1 : 1;
    previousActiveMs = day.ms;
    longest = Math.max(longest, currentRun);
    latestActiveRun = currentRun;
  }

  return {
    current: latestActiveRun,
    longest
  };
}

function peakDay(days: DailyUsage[]): DailyUsage | undefined {
  const [peak] = topDays(days).filter((day) => day.totalTokens > 0);
  return peak;
}

function topFeatures(days: DailyUsage[]): FeatureTotal[] {
  const featureMap = new Map<string, number>();
  for (const day of days) {
    for (const [feature, count] of Object.entries(day.featureCounts ?? {})) {
      featureMap.set(feature, (featureMap.get(feature) ?? 0) + count);
    }
  }
  return [...featureMap.entries()]
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count || a.feature.localeCompare(b.feature));
}

function formatFeatureSummary(features: FeatureTotal[]): string {
  if (features.length === 0) {
    return "No local evidence";
  }
  return features
    .slice(0, 2)
    .map((feature) => `${feature.feature} (${formatNumber(feature.count)})`)
    .join(", ");
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

function featureTable(features: FeatureTotal[]): string {
  if (features.length === 0) {
    return '<p class="notice">No explicit plugin or /fast mode evidence was found in the available local logs.</p>';
  }
  const rows = features
    .map((feature) => `<tr><td>${escapeHtml(feature.feature)}</td><td>${formatNumber(feature.count)}</td></tr>`)
    .join("");
  return `<table><thead><tr><th>Feature</th><th>Events</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function previewCard(x: number, y: number, label: string, value: string): string {
  return `<rect x="${x}" y="${y}" width="340" height="96" rx="8" fill="#ffffff" stroke="#d0d7de"/>
<text x="${x + 20}" y="${y + 30}" font-family="Arial, sans-serif" font-size="16" fill="#57606a">${escapeHtml(label)}</text>
<text x="${x + 20}" y="${y + 68}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#24292f">${escapeHtml(value)}</text>`;
}

function renderProfilePreviewSvg(days: DailyUsage[], options: RenderOptions, generatedAt: string): string {
  const sum = totals(days);
  const activeDays = days.filter((day) => day.totalTokens > 0).length;
  const streaks = streakStats(days);
  const peak = peakDay(days);
  const features = topFeatures(days);
  const heatmap = renderHeatmapSvg(days, options);
  const title = options.title ?? "Codex Usage Heatmap";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${escapeHtml(title)} profile preview">
<rect width="1200" height="720" fill="#f6f8fa"/>
<text x="56" y="66" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#24292f">${escapeHtml(title)}</text>
<text x="56" y="96" font-family="Arial, sans-serif" font-size="17" fill="#57606a">Local Codex profile-style activity view for token logs.</text>
${previewCard(56, 128, "Activity graph", `${formatNumber(activeDays)} active days`)}
${previewCard(430, 128, "Latest streak", `${formatNumber(streaks.current)} days`)}
${previewCard(804, 128, "Longest streak", `${formatNumber(streaks.longest)} days`)}
${previewCard(56, 248, "Lifetime tokens", formatNumber(sum.totalTokens))}
${previewCard(430, 248, "Peak daily tokens", peak ? `${formatNumber(peak.totalTokens)} on ${peak.date}` : "No usage data")}
${previewCard(804, 248, "Top features", formatFeatureSummary(features))}
<rect x="56" y="388" width="1088" height="268" rx="8" fill="#ffffff" stroke="#d0d7de"/>
<text x="80" y="424" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#24292f">Activity Graph</text>
<g transform="translate(80 452) scale(1.2)">${heatmap}</g>
<text x="56" y="692" font-family="Arial, sans-serif" font-size="13" fill="#57606a">Generated locally at ${escapeHtml(generatedAt)}. No prompts, responses, credentials, or raw logs included.</text>
</svg>`;
}

export function renderHtmlReport(days: DailyUsage[], options: RenderOptions = {}): ReportOutput {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const theme = getTheme(options.theme ?? "github");
  const svg = renderHeatmapSvg(days, options);
  const sum = totals(days);
  const activeDays = days.filter((day) => day.totalTokens > 0).length;
  const dateRange = days.length ? `${days[0]?.date} to ${days.at(-1)?.date}` : "No usage data";
  const last30Total = last30(days).reduce((acc, day) => acc + day.totalTokens, 0);
  const streaks = streakStats(days);
  const peak = peakDay(days);
  const features = topFeatures(days);
  const pageTitle = options.title ?? "Codex Usage Heatmap";
  const previewSvg = renderProfilePreviewSvg(days, { ...options, title: pageTitle }, generatedAt);
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
<h1>${escapeHtml(pageTitle)}</h1>
<p class="subtitle">Local-only Codex profile-style activity view for token logs.</p>
<section class="summary" aria-label="Codex profile summary">
${summaryCard("Activity graph", `${formatNumber(activeDays)} active days`)}
${summaryCard("Latest streak", `${formatNumber(streaks.current)} days`)}
${summaryCard("Longest streak", `${formatNumber(streaks.longest)} days`)}
${summaryCard("Lifetime tokens", formatNumber(sum.totalTokens))}
${summaryCard("Peak daily tokens", peak ? `${formatNumber(peak.totalTokens)} on ${peak.date}` : "No usage data")}
${summaryCard("Top features", formatFeatureSummary(features))}
${summaryCard("Input tokens", formatNumber(sum.inputTokens))}
${summaryCard("Cached input tokens", formatNumber(sum.cachedInputTokens))}
${summaryCard("Output tokens", formatNumber(sum.outputTokens))}
${summaryCard("Reasoning output tokens", formatNumber(sum.reasoningOutputTokens))}
${summaryCard("Events", formatNumber(sum.events))}
${summaryCard("Active days", formatNumber(activeDays))}
${summaryCard("Date range", dateRange)}
</section>
<section>
<h2>Activity Graph</h2>
<div class="heatmap">${svg}</div>
</section>
<section>
<h2>Top Features</h2>
${featureTable(features)}
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
<p class="notice">Profile metrics are derived from locally available logs. Lifetime tokens, streaks, and peak daily tokens may be incomplete when logs are missing. Top feature counts require explicit plugin or /fast mode fields in those logs.</p>
</section>
<p class="muted">Generated at ${escapeHtml(generatedAt)}.</p>
<p class="muted">Command hint: <code>cuh report --out ./codex-usage-report</code></p>
</main>
</body>
</html>`;

  return {
    html,
    svg,
    previewSvg,
    json: exportJson(days, true),
    csv: exportCsv(days)
  };
}
