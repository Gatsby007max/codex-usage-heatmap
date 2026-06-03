import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { discoverLogFiles } from "../src/core/discover.js";

describe("discoverLogFiles", () => {
  it("finds JSONL files and skips non-JSONL files by default", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cuh-discover-"));
    await fs.writeFile(path.join(dir, "usage.jsonl"), "{}\n", "utf8");
    await fs.writeFile(path.join(dir, "usage.json"), "{}\n", "utf8");

    const result = await discoverLogFiles({ source: dir });

    expect(result.foundJsonlFiles).toBe(1);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.path.endsWith("usage.jsonl")).toBe(true);
  });

  it("skips sensitive files", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cuh-sensitive-"));
    await fs.writeFile(path.join(dir, "auth.jsonl"), "{}\n", "utf8");
    await fs.writeFile(path.join(dir, "safe.jsonl"), "{}\n", "utf8");

    const result = await discoverLogFiles({ source: dir });

    expect(result.foundJsonlFiles).toBe(2);
    expect(result.skippedSensitiveFiles).toBe(1);
    expect(result.files).toHaveLength(1);
  });
});
