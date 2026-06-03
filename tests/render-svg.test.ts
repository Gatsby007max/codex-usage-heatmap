import { describe, expect, it } from "vitest";

import { renderHeatmapSvg } from "../src/render/heatmapSvg.js";
import { generateSampleUsage } from "../src/sample/generateSampleUsage.js";

describe("renderHeatmapSvg", () => {
  it("contains expected cells and titles without raw log content", () => {
    const svg = renderHeatmapSvg(generateSampleUsage(2026), { year: 2026 });
    expect(svg).toContain("<svg");
    expect(svg).toContain("data-date=\"2026-06-03\"");
    expect(svg).toContain("<title>2026-06-03:");
    expect(svg).not.toContain("prompt");
    expect(svg).not.toContain("response");
    expect(svg).not.toContain("raw logs");
  });
});
