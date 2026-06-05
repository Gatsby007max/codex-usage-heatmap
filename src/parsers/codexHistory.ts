import type { ParsedUsageCandidate, ParserContext, UsageParser } from "../types.js";
import { asRecord, featureHintsFromRecord, firstString, getNested, usageFromObject } from "./helpers.js";

const version = "1.0.0";

export const codexHistoryParser: UsageParser = {
  name: "codexHistoryParser",
  version,
  canParse(record: unknown): boolean {
    const object = asRecord(record);
    if (!object) {
      return false;
    }

    const kind = firstString(object.type, object.kind, object.source);
    return Boolean(
      kind?.includes("history") ||
        usageFromObject(object.usage) ||
        usageFromObject(object.token_usage) ||
        usageFromObject(getNested(object, ["metadata", "usage"]))
    );
  },
  parse(record: unknown, _context: ParserContext): ParsedUsageCandidate[] {
    const object = asRecord(record);
    if (!object) {
      return [];
    }

    const usage =
      usageFromObject(object.usage) ??
      usageFromObject(object.token_usage) ??
      usageFromObject(getNested(object, ["metadata", "usage"]));

    if (!usage) {
      return [];
    }

    return [
      {
        timestamp: firstString(object.timestamp, object.created_at, object.createdAt, object.time),
        model: firstString(object.model, getNested(object, ["metadata", "model"])),
        sessionId: firstString(object.session_id, object.sessionId, getNested(object, ["metadata", "session_id"])),
        features: featureHintsFromRecord(object),
        usage,
        usageKind: "event",
        rawKind: firstString(object.type, object.kind, object.source) ?? "history_usage",
        parserName: this.name,
        parserVersion: this.version
      }
    ];
  }
};
