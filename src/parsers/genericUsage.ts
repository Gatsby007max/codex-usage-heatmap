import type { ParsedUsageCandidate, ParserContext, UsageParser } from "../types.js";
import { asRecord, firstString, getNested, usageFromObject } from "./helpers.js";

const version = "1.0.0";

export const genericUsageParser: UsageParser = {
  name: "genericUsageParser",
  version,
  canParse(record: unknown): boolean {
    const object = asRecord(record);
    return Boolean(object && (usageFromObject(object) || usageFromObject(object.usage)));
  },
  parse(record: unknown, _context: ParserContext): ParsedUsageCandidate[] {
    const object = asRecord(record);
    if (!object) {
      return [];
    }

    const usage = usageFromObject(object) ?? usageFromObject(object.usage);
    if (!usage) {
      return [];
    }

    return [
      {
        timestamp: firstString(object.timestamp, object.created_at, object.createdAt),
        model: firstString(object.model, getNested(object, ["metadata", "model"])),
        sessionId: firstString(object.session_id, object.sessionId),
        usage,
        usageKind: "event",
        rawKind: firstString(object.type, object.kind) ?? "generic_usage",
        parserName: this.name,
        parserVersion: this.version
      }
    ];
  }
};
