import { describe, expect, it } from "vitest";

import { exportCsv } from "../src/exporters/csv.js";
import type { DailyUsage } from "../src/types.js";

describe("exportCsv", () => {
  it("uses stable columns and proper escaping", () => {
    const day: DailyUsage = {
      date: "2026-06-01",
      inputTokens: 1,
      cachedInputTokens: 2,
      outputTokens: 3,
      reasoningOutputTokens: 4,
      totalTokens: 10,
      eventCount: 1,
      sessionCount: 1,
      filesCount: 1,
      featureCounts: { plugins: 2 },
      level: 1,
      levelBasis: "quantile"
    };
    const csv = exportCsv([day]);
    expect(csv.startsWith("date,inputTokens,cachedInputTokens,outputTokens")).toBe(true);
    expect(csv.endsWith("\n")).toBe(true);
    expect(csv).toContain("2026-06-01,1,2,3,4,10,1,1,1,1,quantile,plugins:2");
  });
});
