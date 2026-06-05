import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runDoctorCommand } from "../src/commands/doctor.js";
import { runSampleCommand } from "../src/commands/sample.js";
import { runScanCommand } from "../src/commands/scan.js";

async function captureStdout(run: () => Promise<void>): Promise<string> {
  const originalWrite = process.stdout.write;
  let output = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;

  try {
    await run();
  } finally {
    process.stdout.write = originalWrite;
  }

  return output;
}

describe("CLI smoke tests", () => {
  it("runs sample", async () => {
    const out = await fs.mkdtemp(path.join(os.tmpdir(), "cuh-sample-"));
    await runSampleCommand({ out, year: "2026" });
    await expect(fs.access(path.join(out, "index.html"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(out, "usage.json"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(out, "usage.csv"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(out, "codex-usage.svg"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(out, "profile-preview.svg"))).resolves.toBeUndefined();
  });

  it("runs doctor", async () => {
    const output = await captureStdout(() => runDoctorCommand({ source: "fixtures" }));
    expect(output).toContain("Codex Usage Heatmap Doctor");
  });

  it("runs scan --json", async () => {
    const output = await captureStdout(() => runScanCommand({ json: true, source: "fixtures" }));
    const parsed = JSON.parse(output) as { summary: { recognizedUsageEvents: number } };
    expect(parsed.summary.recognizedUsageEvents).toBeGreaterThan(0);
  });
});
