import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { findLanguageViolations } from "../scripts/check-language.js";

describe("language check", () => {
  it("fails on Japanese characters in public files", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cuh-language-fail-"));
    await fs.writeFile(path.join(dir, "README.md"), `Hello ${"\u3053\u3093\u306b\u3061\u306f"}\n`, "utf8");
    const violations = await findLanguageViolations(dir);
    expect(violations).toHaveLength(1);
  });

  it("passes on English-only files", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cuh-language-pass-"));
    await fs.writeFile(path.join(dir, "README.md"), "Hello world\n", "utf8");
    const violations = await findLanguageViolations(dir);
    expect(violations).toHaveLength(0);
  });
});
