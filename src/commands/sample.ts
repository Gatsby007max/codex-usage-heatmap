import { renderHtmlReport } from "../render/htmlReport.js";
import { generateSampleUsage } from "../sample/generateSampleUsage.js";
import { parseTheme, parseYear, writeReportFiles } from "./shared.js";

export async function runSampleCommand(options: Record<string, unknown>): Promise<void> {
  const year = parseYear(typeof options.year === "string" ? options.year : undefined) ?? new Date().getFullYear();
  const days = generateSampleUsage(year);
  const output = renderHtmlReport(days, {
    year,
    theme: parseTheme(typeof options.theme === "string" ? options.theme : undefined),
    title: "Codex Usage Heatmap Sample"
  });
  const outDir = typeof options.out === "string" ? options.out : "sample-report";
  await writeReportFiles(outDir, output);
  process.stdout.write(`Sample report written to ${outDir}\n`);
}
