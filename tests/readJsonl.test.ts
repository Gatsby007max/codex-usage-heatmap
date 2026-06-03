import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readJsonlFile } from "../src/core/readJsonl.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

describe("readJsonlFile", () => {
  it("reads valid JSONL", async () => {
    const result = await readJsonlFile(path.join(fixturesDir, "codex-token-count.jsonl"));
    expect(result.parsedLines).toBe(3);
    expect(result.malformedLines).toBe(0);
    expect(result.records).toHaveLength(3);
  });

  it("continues after malformed lines and counts them", async () => {
    const result = await readJsonlFile(path.join(fixturesDir, "malformed-lines.jsonl"));
    expect(result.parsedLines).toBe(2);
    expect(result.malformedLines).toBe(1);
    expect(result.records).toHaveLength(2);
  });
});
