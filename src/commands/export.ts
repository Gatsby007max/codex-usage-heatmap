import { exportCsv } from "../exporters/csv.js";
import { exportJson } from "../exporters/json.js";
import { scanUsage } from "../core/scan.js";
import { CliError, scanOptionsFromCommand, writeTextFile } from "./shared.js";

export async function runExportCommand(options: Record<string, unknown>): Promise<void> {
  const format = typeof options.format === "string" ? options.format : "json";
  if (!["json", "csv"].includes(format)) {
    throw new CliError("Format must be json or csv.");
  }

  const result = await scanUsage(scanOptionsFromCommand(options));
  const contents = format === "csv" ? exportCsv(result.dailyUsage) : exportJson(result.dailyUsage, Boolean(options.pretty));
  const defaultName = format === "csv" ? "usage.csv" : "usage.json";
  const outPath = typeof options.out === "string" ? options.out : defaultName;
  await writeTextFile(outPath, contents);
  process.stdout.write(`Export written to ${outPath}\n`);
}
