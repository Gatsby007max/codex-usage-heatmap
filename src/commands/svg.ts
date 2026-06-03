import { scanUsage } from "../core/scan.js";
import { renderHeatmapSvg } from "../render/heatmapSvg.js";
import { activeYear, parseMetric, parseTheme, parseWeekStart, parseYear, scanOptionsFromCommand, writeTextFile } from "./shared.js";

export async function runSvgCommand(options: Record<string, unknown>): Promise<void> {
  const result = await scanUsage(scanOptionsFromCommand(options));
  const year = activeYear(result.dailyUsage, parseYear(typeof options.year === "string" ? options.year : undefined));
  const svg = renderHeatmapSvg(result.dailyUsage, {
    year,
    title: typeof options.title === "string" ? options.title : "Codex Usage Heatmap",
    theme: parseTheme(typeof options.theme === "string" ? options.theme : undefined),
    metric: parseMetric(typeof options.metric === "string" ? options.metric : undefined),
    weekStart: parseWeekStart(typeof options.weekStart === "string" ? options.weekStart : undefined)
  });
  const outPath = typeof options.out === "string" ? options.out : "codex-usage.svg";
  await writeTextFile(outPath, svg);
  process.stdout.write(`SVG written to ${outPath}\n`);
}
