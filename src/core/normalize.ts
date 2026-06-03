import { SUSPICIOUS_TOKEN_DELTA } from "../config/defaults.js";
import type {
  EstimationMode,
  NormalizedUsageEvent,
  ParsedUsageCandidate,
  ParserContext,
  TokenUsage
} from "../types.js";
import { stableHash } from "./hash.js";
import { redactPath } from "./privacy.js";
import { dateKeyFromTimestamp, parseTimestamp } from "./timezone.js";

export interface NormalizeState {
  previousTotals: Map<string, TokenUsage>;
  warnings: string[];
  skippedEvents: number;
}

interface NormalizeOptions {
  timezone?: string;
  includePaths?: boolean;
}

export function createNormalizeState(): NormalizeState {
  return {
    previousTotals: new Map<string, TokenUsage>(),
    warnings: [],
    skippedEvents: 0
  };
}

function subtractUsage(current: TokenUsage, previous: TokenUsage): TokenUsage | undefined {
  const delta = {
    inputTokens: current.inputTokens - previous.inputTokens,
    cachedInputTokens: current.cachedInputTokens - previous.cachedInputTokens,
    outputTokens: current.outputTokens - previous.outputTokens,
    reasoningOutputTokens: current.reasoningOutputTokens - previous.reasoningOutputTokens,
    totalTokens: current.totalTokens - previous.totalTokens
  };

  if (Object.values(delta).some((value) => value < 0)) {
    return undefined;
  }

  return delta;
}

function totalFromParts(usage: TokenUsage): TokenUsage {
  const partTotal =
    usage.inputTokens + usage.cachedInputTokens + usage.outputTokens + usage.reasoningOutputTokens;
  return {
    ...usage,
    totalTokens: usage.totalTokens || partTotal
  };
}

function resolveTimestamp(
  candidate: ParsedUsageCandidate,
  context: ParserContext
): { timestamp: string; estimationMode: EstimationMode } {
  const parsed = parseTimestamp(candidate.timestamp);
  if (parsed) {
    return { timestamp: parsed.toISOString(), estimationMode: "none" };
  }

  if (context.fileMtime) {
    return { timestamp: context.fileMtime.toISOString(), estimationMode: "file_mtime" };
  }

  return { timestamp: new Date(0).toISOString(), estimationMode: "unknown_timestamp" };
}

export function normalizeCandidate(
  candidate: ParsedUsageCandidate,
  context: ParserContext,
  state: NormalizeState,
  options: NormalizeOptions = {}
): NormalizedUsageEvent | undefined {
  const timezone = options.timezone ?? "local";
  let usage = totalFromParts(candidate.usage);
  let estimationMode: EstimationMode = candidate.usageKind === "total" ? "total_as_event" : "none";

  if (candidate.usageKind === "total") {
    const sessionKey = [
      candidate.sessionId ?? context.sourceFile,
      candidate.model ?? "unknown",
      candidate.parserName
    ].join(":");
    const previous = state.previousTotals.get(sessionKey);
    state.previousTotals.set(sessionKey, usage);

    if (previous) {
      const delta = subtractUsage(usage, previous);
      if (!delta) {
        state.skippedEvents += 1;
        state.warnings.push("Skipped usage event with negative cumulative token delta.");
        return undefined;
      }
      usage = delta;
      estimationMode = "total_delta";
    } else {
      state.warnings.push("Used cumulative token usage as an event because no previous total was available.");
    }
  }

  if (usage.totalTokens > SUSPICIOUS_TOKEN_DELTA) {
    state.warnings.push("Encountered a suspiciously large token delta.");
  }

  const timestampResult = resolveTimestamp(candidate, context);
  const finalEstimationMode =
    estimationMode === "none" ? timestampResult.estimationMode : estimationMode;
  const date = dateKeyFromTimestamp(timestampResult.timestamp, timezone);
  const sourceFile = redactPath(context.sourceFile, options.includePaths);

  const id = stableHash([
    context.sourceFile,
    context.sourceLine,
    timestampResult.timestamp,
    usage,
    candidate.rawKind,
    candidate.parserName
  ]);

  return {
    id,
    sourceFile,
    sourceLine: context.sourceLine,
    timestamp: timestampResult.timestamp,
    date,
    timezone,
    model: candidate.model,
    sessionId: candidate.sessionId,
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens,
    outputTokens: usage.outputTokens,
    reasoningOutputTokens: usage.reasoningOutputTokens,
    totalTokens: usage.totalTokens,
    rawKind: candidate.rawKind,
    parserVersion: `${candidate.parserName}@${candidate.parserVersion}`,
    estimationMode: finalEstimationMode
  };
}
