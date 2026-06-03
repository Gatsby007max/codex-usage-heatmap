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
