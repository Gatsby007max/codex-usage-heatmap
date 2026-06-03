import { DEFAULT_REPORT_DIR } from "../config/defaults.js";
import { scanUsage } from "../core/scan.js";
import { renderHtmlReport } from "../render/htmlReport.js";
import { activeYear, parseMetric, parseTheme, parseWeekStart, parseYear, scanOptionsFromCommand, writeReportFiles } from "./shared.js";

export async function runReportCommand(options: Record<string, unknown>): Promise<void> {
  const scanOptions = scanOptionsFromCommand(options);
  const result = await scanUsage(scanOptions);
  const year = activeYear(result.dailyUsage, parseYear(typeof options.year === "string" ? options.year : undefined));
  const output = renderHtmlReport(result.dailyUsage, {
    year,
    theme: parseTheme(typeof options.theme === "string" ? options.theme : undefined),
    metric: parseMetric(typeof options.metric === "string" ? options.metric : undefined),
    weekStart: parseWeekStart(typeof options.weekStart === "string" ? options.weekStart : undefined)
  });
  const outDir = typeof options.out === "string" ? options.out : DEFAULT_REPORT_DIR;
  await writeReportFiles(outDir, output);
  process.stdout.write(`Report written to ${outDir}\n`);
}
