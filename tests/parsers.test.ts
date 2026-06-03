import { describe, expect, it } from "vitest";

import { createNormalizeState, normalizeCandidate } from "../src/core/normalize.js";
import { codexTokenCountParser } from "../src/parsers/codexTokenCount.js";
import { genericUsageParser } from "../src/parsers/genericUsage.js";

const context = {
  sourceFile: "/tmp/safe.jsonl",
  sourceLine: 1,
  fileMtime: new Date("2026-06-07T00:00:00.000Z")
};

describe("parsers", () => {
  it("parses token_count with last_token_usage", () => {
    const candidates = codexTokenCountParser.parse(
      {
        type: "token_count",
        timestamp: "2026-06-01T00:00:00.000Z",
        payload: {
          info: {
            last_token_usage: {
              input_tokens: 1,
              cached_input_tokens: 2,
              output_tokens: 3,
              reasoning_output_tokens: 4,
              total_tokens: 10
            }
          }
        }
      },
      context
    );

    expect(candidates[0]?.usage.totalTokens).toBe(10);
    expect(candidates[0]?.usageKind).toBe("event");
  });

  it("parses total_token_usage and converts to delta", () => {
    const state = createNormalizeState();
    const first = codexTokenCountParser.parse(
      {
        type: "token_count",
        timestamp: "2026-06-01T00:00:00.000Z",
        session_id: "s1",
        payload: { info: { total_token_usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 } } }
      },
      context
    )[0];
    const second = codexTokenCountParser.parse(
      {
        type: "token_count",
        timestamp: "2026-06-01T00:10:00.000Z",
        session_id: "s1",
        payload: { info: { total_token_usage: { input_tokens: 30, output_tokens: 15, total_tokens: 45 } } }
      },
      { ...context, sourceLine: 2 }
    )[0];

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    const firstEvent = normalizeCandidate(first!, context, state);
    const secondEvent = normalizeCandidate(second!, { ...context, sourceLine: 2 }, state);

    expect(firstEvent?.estimationMode).toBe("total_as_event");
    expect(secondEvent?.estimationMode).toBe("total_delta");
    expect(secondEvent?.totalTokens).toBe(30);
  });

  it("handles missing timestamp with file metadata", () => {
    const candidate = genericUsageParser.parse(
      {
        type: "usage",
        input_tokens: 5,
        output_tokens: 5,
        total_tokens: 10
      },
      context
    )[0];
    const event = normalizeCandidate(candidate!, context, createNormalizeState());

    expect(event?.timestamp).toBe("2026-06-07T00:00:00.000Z");
    expect(event?.estimationMode).toBe("file_mtime");
  });

  it("ignores non-usage records", () => {
    expect(genericUsageParser.canParse({ type: "note" })).toBe(false);
  });
});
