#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { SourceNotReadableError } from "./core/discover.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runExportCommand } from "./commands/export.js";
import { runReportCommand } from "./commands/report.js";
import { runSampleCommand } from "./commands/sample.js";
import { runScanCommand } from "./commands/scan.js";
import { runSkillInstallCommand } from "./commands/skill-install.js";
import { runSvgCommand } from "./commands/svg.js";
import { CliError } from "./commands/shared.js";

function addScanOptions(command: Command): Command {
  return command
    .option("--source <path>", "Source path or auto discovery", "auto")
    .option("--since <YYYY-MM-DD>", "Inclusive start date")
    .option("--until <YYYY-MM-DD>", "Inclusive end date")
    .option("--timezone <timezone>", "local, UTC, or IANA timezone", "local")
    .option("--include-paths", "Include local paths in diagnostics")
    .option("--cache <path>", "Reserved cache path option")
    .option("--max-file-size-mb <number>", "Maximum JSONL file size to scan", "25")
    .option("--week-start <sunday|monday>", "Calendar week start", "sunday");
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("cuh")
    .description("Visualize local Codex token usage as a GitHub-style heatmap.")
    .version("0.1.0")
    .exitOverride();

  addScanOptions(program.command("scan").description("Scan local Codex JSONL logs."))
    .option("--json", "Print machine-readable JSON only")
    .action(runScanCommand);

  addScanOptions(program.command("doctor").description("Diagnose environment and parsing status.")).action(
    runDoctorCommand
  );

  addScanOptions(program.command("report").description("Generate a static HTML report."))
    .option("--out <path>", "Output directory", "./codex-usage-report")
    .option("--theme <github|dark|blue|gray>", "Report theme", "github")
    .option("--metric <total|input|output|cached|reasoning>", "Heatmap metric", "total")
    .option("--year <YYYY>", "Calendar year")
    .action(runReportCommand);

  addScanOptions(program.command("svg").description("Generate a standalone SVG heatmap."))
    .option("--out <path>", "Output SVG path", "./codex-usage.svg")
    .option("--year <YYYY>", "Calendar year")
    .option("--theme <github|dark|blue|gray>", "SVG theme", "github")
    .option("--metric <total|input|output|cached|reasoning>", "Heatmap metric", "total")
    .option("--title <string>", "SVG title", "Codex Usage Heatmap")
    .action(runSvgCommand);

  addScanOptions(program.command("export").description("Export daily usage data."))
    .option("--format <json|csv>", "Export format", "json")
    .option("--out <path>", "Output file path")
    .option("--pretty", "Pretty-print JSON")
    .action(runExportCommand);

  program
    .command("sample")
    .description("Generate deterministic sample data and a sample report.")
    .option("--out <path>", "Output directory", "./sample-report")
    .option("--year <YYYY>", "Calendar year")
    .option("--theme <github|dark|blue|gray>", "Report theme", "github")
    .action(runSampleCommand);

  program
    .command("skill-install")
    .description("Install or refresh the included Codex Skill.")
    .requiredOption("--scope <repo|user>", "Install scope")
    .option("--force", "Overwrite existing skill files")
    .action(runSkillInstallCommand);

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  try {
    await createProgram().parseAsync(argv);
  } catch (error) {
    if (error instanceof SourceNotReadableError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
    } else if (error instanceof CliError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
    } else if (error && typeof error === "object" && "exitCode" in error) {
      process.exitCode = Number((error as { exitCode: number }).exitCode);
    } else {
      process.stderr.write(error instanceof Error ? `${error.message}\n` : "Internal error.\n");
      process.exitCode = 3;
    }
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (path.resolve(currentFile) === invokedFile) {
  await runCli();
}
