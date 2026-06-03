# Data Schema

## NormalizedUsageEvent

- `id`: stable event hash
- `sourceFile`: optional source file path, redacted unless explicitly included
- `sourceLine`: optional JSONL line number
- `timestamp`: ISO timestamp used for aggregation
- `date`: date key in `YYYY-MM-DD`
- `timezone`: local, UTC, or IANA timezone label
- `model`: optional model name
- `sessionId`: optional session identifier
- `inputTokens`: input token count
- `cachedInputTokens`: cached input token count
- `outputTokens`: output token count
- `reasoningOutputTokens`: reasoning output token count
- `totalTokens`: total token count
- `rawKind`: parser-level event kind
- `parserVersion`: parser adapter version
- `estimationMode`: normalization confidence label

## DailyUsage

Daily usage aggregates token counts, event count, session count, file count, and heatmap
level.

## ScanSummary

Scan summaries include checked paths, discovered JSONL files, skipped sensitive files,
readable files, parsed lines, malformed lines, recognized events, skipped events, and
warnings.

## Estimation Modes

- `none`: event-level usage was available.
- `total_delta`: cumulative totals were converted to an event delta.
- `total_as_event`: a cumulative total was used because no previous total existed.
- `file_mtime`: file metadata supplied a missing timestamp.
- `unknown_timestamp`: timestamp could not be determined precisely.

## Aggregation Rules

The default date basis is the local timezone. UTC and IANA timezone strings are supported
when the runtime can format them. Date filters are inclusive.
