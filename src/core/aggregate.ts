import type { DailyUsage, LevelBasis, NormalizedUsageEvent } from "../types.js";
import { assignLevels, parseFixedThresholds } from "./levels.js";
import { compareDateKey } from "./timezone.js";

interface AggregateOptions {
  since?: string;
  until?: string;
  levelMode?: LevelBasis;
  levelFixed?: string;
}

interface MutableDailyUsage extends DailyUsage {
  sessions: Set<string>;
  files: Set<string>;
}

export function aggregateDailyUsage(
  events: NormalizedUsageEvent[],
  options: AggregateOptions = {}
): DailyUsage[] {
  const map = new Map<string, MutableDailyUsage>();

  for (const event of events) {
    if (!compareDateKey(event.date, options.since, options.until)) {
      continue;
    }

    const day =
      map.get(event.date) ??
      ({
        date: event.date,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 0,
        eventCount: 0,
        sessionCount: 0,
        filesCount: 0,
        level: 0,
        levelBasis: options.levelMode ?? "quantile",
        sessions: new Set<string>(),
        files: new Set<string>()
      } satisfies MutableDailyUsage);

    day.inputTokens += event.inputTokens;
    day.cachedInputTokens += event.cachedInputTokens;
    day.outputTokens += event.outputTokens;
    day.reasoningOutputTokens += event.reasoningOutputTokens;
    day.totalTokens += event.totalTokens;
    day.eventCount += 1;

    if (event.sessionId) {
      day.sessions.add(event.sessionId);
    }
    if (event.sourceFile) {
      day.files.add(event.sourceFile);
    }

    map.set(event.date, day);
  }

  const days = [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ sessions, files, ...day }) => ({
      ...day,
      sessionCount: sessions.size,
      filesCount: files.size
    }));

  const basis = options.levelMode ?? "quantile";
  const fixedThresholds = basis === "fixed" ? parseFixedThresholds(options.levelFixed ?? "") : undefined;
  return assignLevels(days, basis, fixedThresholds);
}
