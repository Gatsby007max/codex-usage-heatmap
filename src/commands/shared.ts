import fs from "node:fs/promises";
import path from "node:path";

import type { DailyUsage, ScanOptions, ThemeName, UsageMetric, WeekStart } from "../types.js";

export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function parseYear(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1970 || year > 9999) {
    throw new CliError("Year must be a four-digit number.");
  }
  return year;
}

export function parseTheme(value: string | undefined): ThemeName {
  const theme = value ?? "github";
  if (!["github", "dark", "blue", "gray"].includes(theme)) {
    throw new CliError("Theme must be one of: github, dark, blue, gray.");
  }
  return theme as ThemeName;
}

export function parseMetric(value: string | undefined): UsageMetric {
  const metric = value ?? "total";
  if (!["total", "input", "output", "cached", "reasoning"].includes(metric)) {
    throw new CliError("Metric must be one of: total, input, output, cached, reasoning.");
  }
  return metric as UsageMetric;
}

export function parseWeekStart(value: string | undefined): WeekStart {
  const weekStart = value ?? "sunday";
  if (!["sunday", "monday"].includes(weekStart)) {
    throw new CliError("Week start must be sunday or monday.");
  }
  return weekStart as WeekStart;
}

export function scanOptionsFromCommand(options: Record<string, unknown>): ScanOptions {
  return {
    source: typeof options.source === "string" ? options.source : undefined,
    since: typeof options.since === "string" ? options.since : undefined,
    until: typeof options.until === "string" ? options.until : undefined,
    timezone: typeof options.timezone === "string" ? options.timezone : undefined,
    includePaths: Boolean(options.includePaths),
    maxFileSizeMb: options.maxFileSizeMb ? Number(options.maxFileSizeMb) : undefined,
    weekStart: parseWeekStart(typeof options.weekStart === "string" ? options.weekStart : undefined),
    cache: typeof options.cache === "string" ? options.cache : undefined
  };
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

export async function writeReportFiles(
  outDir: string,
  output: { html: string; svg: string; json: string; csv: string }
): Promise<void> {
  await fs.mkdir(outDir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outDir, "index.html"), output.html, "utf8"),
    fs.writeFile(path.join(outDir, "usage.json"), output.json, "utf8"),
    fs.writeFile(path.join(outDir, "usage.csv"), output.csv, "utf8"),
    fs.writeFile(path.join(outDir, "codex-usage.svg"), output.svg, "utf8")
  ]);
}

export function activeYear(days: DailyUsage[], requestedYear?: number): number {
  return requestedYear ?? Number(days.at(-1)?.date.slice(0, 4) ?? new Date().getFullYear());
}
