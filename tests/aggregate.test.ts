import { describe, expect, it } from "vitest";

import { aggregateDailyUsage } from "../src/core/aggregate.js";
import type { NormalizedUsageEvent } from "../src/types.js";

function event(
  id: string,
  date: string,
  totalTokens: number,
  sessionId: string,
  features: string[] = []
): NormalizedUsageEvent {
  return {
    id,
    date,
    timestamp: `${date}T00:00:00.000Z`,
    timezone: "UTC",
    sourceFile: `source:${id}`,
    sourceLine: 1,
    sessionId,
    inputTokens: totalTokens,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens,
    rawKind: "test",
    parserVersion: "test@1",
    estimationMode: "none",
    features
  };
}

describe("aggregateDailyUsage", () => {
  it("aggregates by date and counts sessions and files", () => {
    const days = aggregateDailyUsage([event("a", "2026-06-01", 10, "s1"), event("b", "2026-06-01", 20, "s2")]);
    expect(days).toHaveLength(1);
    expect(days[0]?.totalTokens).toBe(30);
    expect(days[0]?.sessionCount).toBe(2);
    expect(days[0]?.filesCount).toBe(2);
    expect(days[0]?.featureCounts).toEqual({});
  });

  it("handles date range filters", () => {
    const days = aggregateDailyUsage([
      event("a", "2026-06-01", 10, "s1"),
      event("b", "2026-06-02", 20, "s2")
    ], { since: "2026-06-02", until: "2026-06-02" });
    expect(days).toHaveLength(1);
    expect(days[0]?.date).toBe("2026-06-02");
  });

  it("counts feature hints by day", () => {
    const days = aggregateDailyUsage([
      event("a", "2026-06-01", 10, "s1", ["plugins", "/fast mode"]),
      event("b", "2026-06-01", 20, "s2", ["plugins"])
    ]);

    expect(days[0]?.featureCounts).toEqual({ "/fast mode": 1, plugins: 2 });
  });
});
