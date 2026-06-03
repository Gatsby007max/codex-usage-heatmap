import type { ParsedUsageCandidate, ParserContext, UsageParser } from "../types.js";
import { asRecord, firstString, getNested, usageFromObject } from "./helpers.js";

const version = "1.0.0";

function kindOf(record: Record<string, unknown>): string | undefined {
  return firstString(record.type, getNested(record, ["payload", "type"]), record.kind);
}

function sessionOf(record: Record<string, unknown>): string | undefined {
  return firstString(
    record.session_id,
    record.sessionId,
    getNested(record, ["payload", "session_id"]),
    getNested(record, ["payload", "sessionId"]),
    getNested(record, ["payload", "info", "session_id"]),
    getNested(record, ["payload", "info", "sessionId"])
  );
}

function timestampOf(record: Record<string, unknown>): string | undefined {
  return firstString(
    record.timestamp,
    record.created_at,
    record.createdAt,
    record.time,
    getNested(record, ["payload", "timestamp"]),
    getNested(record, ["payload", "created_at"]),
    getNested(record, ["payload", "info", "timestamp"])
  );
}

function modelOf(record: Record<string, unknown>): string | undefined {
  return firstString(
    record.model,
    getNested(record, ["payload", "model"]),
    getNested(record, ["payload", "info", "model"])
  );
}

export const codexTokenCountParser: UsageParser = {
  name: "codexTokenCountParser",
  version,
  canParse(record: unknown): boolean {
    const object = asRecord(record);
    if (!object) {
      return false;
    }

    const kind = kindOf(object);
    return Boolean(
      kind === "token_count" ||
        getNested(object, ["payload", "info", "last_token_usage"]) ||
        getNested(object, ["payload", "info", "total_token_usage"]) ||
        usageFromObject(object)
    );
  },
  parse(record: unknown, _context: ParserContext): ParsedUsageCandidate[] {
    const object = asRecord(record);
    if (!object) {
      return [];
    }

    const lastUsage =
      usageFromObject(getNested(object, ["payload", "info", "last_token_usage"])) ??
      usageFromObject(getNested(object, ["payload", "last_token_usage"])) ??
      usageFromObject(object.last_token_usage);
    const totalUsage =
      usageFromObject(getNested(object, ["payload", "info", "total_token_usage"])) ??
      usageFromObject(getNested(object, ["payload", "total_token_usage"])) ??
      usageFromObject(object.total_token_usage);
    const directUsage = usageFromObject(object);
    const usage = lastUsage ?? totalUsage ?? directUsage;

    if (!usage) {
      return [];
    }

    return [
      {
        timestamp: timestampOf(object),
        model: modelOf(object),
        sessionId: sessionOf(object),
        usage,
        usageKind: totalUsage && !lastUsage ? "total" : "event",
        rawKind: kindOf(object) ?? "token_count",
        parserName: this.name,
        parserVersion: this.version
      }
    ];
  }
};
