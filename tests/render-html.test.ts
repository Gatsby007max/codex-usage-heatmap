import { describe, expect, it } from "vitest";

import { PRIVACY_NOTICE } from "../src/config/defaults.js";
import { renderHtmlReport } from "../src/render/htmlReport.js";
import { generateSampleUsage } from "../src/sample/generateSampleUsage.js";

describe("renderHtmlReport", () => {
  it("contains summary, heatmap, privacy notice, and no external assets", () => {
    const report = renderHtmlReport(generateSampleUsage(2026), { year: 2026 });
    expect(report.html).toContain("Codex Usage Heatmap");
    expect(report.html).toContain("Codex profile summary");
    expect(report.html).toContain("Latest streak");
    expect(report.html).toContain("Peak daily tokens");
    expect(report.html).toContain("Top Features");
    expect(report.html).toContain(PRIVACY_NOTICE);
    expect(report.html).toContain("<style>");
    expect(report.html).not.toContain("<link");
    expect(report.html).not.toMatch(/\s(?:src|href)=["']https?:\/\//);
    expect(report.html).not.toContain("<script");
  });
});
