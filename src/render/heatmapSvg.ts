import type { DailyUsage, HeatmapLevel, RenderOptions, UsageMetric } from "../types.js";
import { calculateQuantileThresholds, levelForValue } from "../core/levels.js";
import { getTheme } from "./themes.js";
import { renderSvgLegend } from "./legend.js";

const cellSize = 11;
const cellGap = 3;
const leftPad = 34;
const topPad = 28;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function metricValue(day: DailyUsage | undefined, metric: UsageMetric): number {
  if (!day) {
    return 0;
  }
  switch (metric) {
    case "input":
      return day.inputTokens;
    case "output":
      return day.outputTokens;
    case "cached":
      return day.cachedInputTokens;
    case "reasoning":
      return day.reasoningOutputTokens;
    case "total":
    default:
      return day.totalTokens;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function dateKey(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dayOffset(date: Date, weekStart: "sunday" | "monday"): number {
  const day = date.getUTCDay();
  return weekStart === "monday" ? (day + 6) % 7 : day;
}

function levelMap(days: DailyUsage[], metric: UsageMetric): Map<string, HeatmapLevel> {
  const thresholds = calculateQuantileThresholds(days.map((day) => metricValue(day, metric)));
  const map = new Map<string, HeatmapLevel>();
  for (const day of days) {
    map.set(day.date, levelForValue(metricValue(day, metric), thresholds));
  }
  return map;
}

export function renderHeatmapSvg(days: DailyUsage[], options: RenderOptions = {}): string {
  const year =
    options.year ??
    Number(days.at(-1)?.date.slice(0, 4) ?? new Date().getFullYear().toString());
  const title = options.title ?? "Codex Usage Heatmap";
  const metric = options.metric ?? "total";
  const weekStart = options.weekStart ?? "sunday";
  const theme = getTheme(options.theme ?? "github");
  const byDate = new Map(days.map((day) => [day.date, day]));
  const byLevel = levelMap(days, metric);
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const startOffset = dayOffset(start, weekStart);
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const weeks = Math.ceil((startOffset + totalDays) / 7);
  const width = leftPad + weeks * (cellSize + cellGap) + 90;
  const height = topPad + 7 * (cellSize + cellGap) + 38;

  const cells: string[] = [];
  const monthLabels: string[] = [];
  const seenMonths = new Set<string>();

  for (let index = 0; index < totalDays; index += 1) {
    const date = addDays(start, index);
    const key = date.toISOString().slice(0, 10);
    const position = startOffset + index;
    const week = Math.floor(position / 7);
    const row = position % 7;
    const x = leftPad + week * (cellSize + cellGap);
    const y = topPad + row * (cellSize + cellGap);
    const day = byDate.get(key);
    const value = metricValue(day, metric);
    const level = byLevel.get(key) ?? 0;
    const color = theme.cells[level];

    cells.push(
      `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" data-date="${key}" data-level="${level}"><title>${escapeXml(`${key}: ${formatNumber(value)} tokens`)}</title></rect>`
    );

    if (date.getUTCDate() === 1) {
      const monthKey = dateKey(year, date.getUTCMonth(), 1);
      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        monthLabels.push(
          `<text x="${x}" y="20" font-size="10" fill="${theme.mutedText}">${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`
        );
      }
    }
  }

  const weekdayNames = weekStart === "monday" ? ["Mon", "", "Wed", "", "Fri", "", ""] : ["", "Mon", "", "Wed", "", "Fri", ""];
  const weekdayLabels = weekdayNames
    .map((label, row) =>
      label
        ? `<text x="0" y="${topPad + row * (cellSize + cellGap) + 10}" font-size="10" fill="${theme.mutedText}">${label}</text>`
        : ""
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<rect width="${width}" height="${height}" fill="${theme.background}"/>
<g font-family="Arial, sans-serif">
${monthLabels.join("")}
${weekdayLabels}
<g aria-label="Daily token usage cells">
${cells.join("")}
</g>
${renderSvgLegend(theme, leftPad + Math.max(0, weeks * (cellSize + cellGap) - 126), height - 18)}
</g>
</svg>`;
}
