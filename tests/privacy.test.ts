import { describe, expect, it } from "vitest";

import { containsSecretLikeText, isSensitivePath, redactPath, safeDiagnosticPath } from "../src/core/privacy.js";

describe("privacy helpers", () => {
  it("does not print secrets through basic detection", () => {
    expect(containsSecretLikeText("token sk-test-not-a-real-secret")).toBe(true);
  });

  it("redacts paths by default", () => {
    expect(redactPath("/Users/example/.codex/history.jsonl")).toMatch(/^source:/);
    expect(safeDiagnosticPath("/Users/example/.codex/history.jsonl")).toBe("redacted path");
  });

  it("skips auth-like files", () => {
    expect(isSensitivePath("/Users/example/.codex/auth.json")).toBe(true);
    expect(isSensitivePath("/Users/example/.codex/cookies/session.jsonl")).toBe(true);
  });
});
