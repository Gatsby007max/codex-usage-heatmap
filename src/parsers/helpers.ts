import type { TokenUsage } from "../types.js";

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function getNested(record: unknown, path: string[]): unknown {
  let current: unknown = record;
  for (const key of path) {
    const currentRecord = asRecord(current);
    if (!currentRecord || !(key in currentRecord)) {
      return undefined;
    }
    current = currentRecord[key];
  }
  return current;
}

export function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

interface FeatureCandidate {
  key: string;
  value: unknown;
}

const featureKeys = new Set([
  "feature",
  "features",
  "plugin",
  "plugins",
  "tool",
  "tools",
  "mode",
  "command",
  "slash_command",
  "slashcommand",
  "fast_mode",
  "fastmode",
  "is_fast",
  "isfast"
]);

const nestedFeatureContainers = new Set(["payload", "metadata", "info", "context", "settings"]);

function flattenFeatureText(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenFeatureText(item));
  }
  const record = asRecord(value);
  if (!record) {
    return [];
  }
  return Object.values(record).flatMap((item) => flattenFeatureText(item));
}

function collectFeatureCandidates(value: unknown, depth = 0): FeatureCandidate[] {
  const record = asRecord(value);
  if (!record || depth > 3) {
    return [];
  }

  const candidates: FeatureCandidate[] = [];
  for (const [rawKey, entryValue] of Object.entries(record)) {
    const key = rawKey.toLowerCase();
    if (featureKeys.has(key)) {
      candidates.push({ key, value: entryValue });
    } else if (nestedFeatureContainers.has(key)) {
      candidates.push(...collectFeatureCandidates(entryValue, depth + 1));
    }
  }
  return candidates;
}

export function featureHintsFromRecord(value: unknown): string[] {
  const features = new Set<string>();

  for (const candidate of collectFeatureCandidates(value)) {
    const textValues = flattenFeatureText(candidate.value).map((text) => text.trim().toLowerCase());
    const hasTruthyValue = textValues.some((text) => text && text !== "false" && text !== "0" && text !== "null");

    if (
      (candidate.key.includes("plugin") && hasTruthyValue) ||
      textValues.some((text) => text === "plugin" || text === "plugins" || text.includes(" plugin"))
    ) {
      features.add("plugins");
    }

    if (
      ((candidate.key === "fast_mode" ||
        candidate.key === "fastmode" ||
        candidate.key === "is_fast" ||
        candidate.key === "isfast") &&
        textValues.includes("true")) ||
      textValues.some((text) => text === "fast" || text === "/fast" || text.includes("/fast ") || text.includes("fast mode"))
    ) {
      features.add("/fast mode");
    }
  }

  return [...features].sort();
}

function numberField(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, value);
    }
  }
  return 0;
}

export function usageFromObject(value: unknown): TokenUsage | undefined {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  const inputTokens = numberField(record, "input_tokens", "inputTokens", "prompt_tokens", "promptTokens");
  const cachedInputTokens = numberField(
    record,
    "cached_input_tokens",
    "cachedInputTokens",
    "cache_read_input_tokens"
  );
  const outputTokens = numberField(record, "output_tokens", "outputTokens", "completion_tokens", "completionTokens");
  const reasoningOutputTokens = numberField(
    record,
    "reasoning_output_tokens",
    "reasoningOutputTokens",
    "reasoning_tokens",
    "reasoningTokens"
  );
  const explicitTotal = numberField(record, "total_tokens", "totalTokens");
  const totalTokens = explicitTotal || inputTokens + cachedInputTokens + outputTokens + reasoningOutputTokens;

  if (totalTokens <= 0) {
    return undefined;
  }

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens
  };
}

export function hasUsageLikeFields(value: unknown): boolean {
  return Boolean(usageFromObject(value));
}
