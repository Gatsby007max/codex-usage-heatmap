import { DEFAULT_LEVEL_FIXED, DEFAULT_TIMEZONE } from "../config/defaults.js";
import type { NormalizedUsageEvent, ParserContext, ScanOptions, ScanResult, ScanSummary } from "../types.js";
import { parsers } from "../parsers/index.js";
import { aggregateDailyUsage } from "./aggregate.js";
import { discoverLogFiles } from "./discover.js";
import { createNormalizeState, normalizeCandidate } from "./normalize.js";
import { readJsonlFile } from "./readJsonl.js";

function emptySummary(): ScanSummary {
  return {
    checkedPaths: 0,
    foundJsonlFiles: 0,
    skippedSensitiveFiles: 0,
    readableFiles: 0,
    parsedLines: 0,
    malformedLines: 0,
    recognizedUsageEvents: 0,
    skippedEvents: 0,
    warnings: []
  };
}

export async function scanUsage(options: ScanOptions = {}): Promise<ScanResult> {
  const discovery = await discoverLogFiles(options);
  const summary = emptySummary();
  summary.checkedPaths = discovery.checkedPaths;
  summary.foundJsonlFiles = discovery.foundJsonlFiles;
  summary.skippedSensitiveFiles = discovery.skippedSensitiveFiles;
  summary.readableFiles = discovery.readableFiles;
  summary.warnings.push(...discovery.warnings);

  const normalizeState = createNormalizeState();
  const events: NormalizedUsageEvent[] = [];

  for (const file of discovery.files) {
    const readResult = await readJsonlFile(file.path);
    summary.parsedLines += readResult.parsedLines;
    summary.malformedLines += readResult.malformedLines;

    for (const { line, record } of readResult.records) {
      const context: ParserContext = {
        sourceFile: file.path,
        sourceLine: line,
        fileMtime: file.mtime
      };

      const parser = parsers.find((candidateParser) => candidateParser.canParse(record));
      if (!parser) {
        summary.skippedEvents += 1;
        continue;
      }

      const candidates = parser.parse(record, context);
      if (candidates.length === 0) {
        summary.skippedEvents += 1;
        continue;
      }

      for (const candidate of candidates) {
        const event = normalizeCandidate(candidate, context, normalizeState, {
          timezone: options.timezone ?? DEFAULT_TIMEZONE,
          includePaths: options.includePaths
        });
        if (event) {
          events.push(event);
          summary.recognizedUsageEvents += 1;
        }
      }
    }
  }

  summary.skippedEvents += normalizeState.skippedEvents;
  summary.warnings.push(...normalizeState.warnings);

  const dailyUsage = aggregateDailyUsage(events, {
    since: options.since,
    until: options.until,
    levelMode: options.levelMode ?? "quantile",
    levelFixed: options.levelFixed ?? DEFAULT_LEVEL_FIXED
  });

  return { summary, events, dailyUsage };
}
