import type { DailyUsage } from "../types.js";
import { assignLevels } from "../core/levels.js";

function wave(day: number, seed: number): number {
  const value = Math.sin((day + seed) / 8) + Math.cos((day + seed) / 17);
  return Math.max(0, value);
}

export function generateSampleUsage(year = new Date().getFullYear()): DailyUsage[] {
  const days: DailyUsage[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  for (let index = 0; index < totalDays; index += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const active = index % 5 !== 0 && index % 13 !== 0;
    const base = active ? Math.round((wave(index, 3) + 0.2) * 18_000 + (index % 11) * 900) : 0;
    const inputTokens = Math.round(base * 0.55);
    const cachedInputTokens = Math.round(base * 0.12);
    const outputTokens = Math.round(base * 0.25);
    const reasoningOutputTokens = Math.max(0, base - inputTokens - cachedInputTokens - outputTokens);

    days.push({
      date: date.toISOString().slice(0, 10),
      inputTokens,
      cachedInputTokens,
      outputTokens,
      reasoningOutputTokens,
      totalTokens: base,
      eventCount: active ? 1 + (index % 4) : 0,
      sessionCount: active ? 1 + (index % 2) : 0,
      filesCount: active ? 1 : 0,
      level: 0,
      levelBasis: "quantile"
    });
  }

  return assignLevels(days, "quantile");
}
