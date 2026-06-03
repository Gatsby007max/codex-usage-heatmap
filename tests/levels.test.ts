import { describe, expect, it } from "vitest";

import { assignLevels, levelForValue, parseFixedThresholds } from "../src/core/levels.js";
import type { DailyUsage } from "../src/types.js";

function day(date: string, totalTokens: number): DailyUsage {
  return {
    date,
    inputTokens: totalTokens,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens,
    eventCount: totalTokens > 0 ? 1 : 0,
    sessionCount: totalTokens > 0 ? 1 : 0,
    filesCount: totalTokens > 0 ? 1 : 0,
    level: 0,
    levelBasis: "quantile"
  };
}

describe("levels", () => {
  it("assigns zero usage level", () => {
    expect(levelForValue(0, [1, 2, 3, 4])).toBe(0);
  });

  it("supports fixed mode", () => {
    const thresholds = parseFixedThresholds("1000,10000,100000,1000000");
    expect(levelForValue(50_000, thresholds)).toBe(3);
  });

  it("supports quantile mode and repeated values", () => {
    const days = assignLevels(
      [day("2026-06-01", 0), day("2026-06-02", 10), day("2026-06-03", 10), day("2026-06-04", 100)],
      "quantile"
    );
    expect(days[0]?.level).toBe(0);
    expect(days[1]?.level).toBeGreaterThanOrEqual(1);
    expect(days[3]?.level).toBe(4);
  });
});
