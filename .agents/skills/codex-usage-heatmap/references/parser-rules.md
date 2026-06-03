# Parser Rules

## JSONL Streaming

- Read files line by line.
- Continue after malformed lines.
- Count malformed lines.
- Do not store raw JSONL lines.

## Sensitive File Denylist

Skip credential-like paths before opening files. This includes auth files, environment files,
private keys, cookies, token stores, and sensitive configuration names.

## Token Count Handling

Recognize Codex-like `token_count` records and usage objects under `payload.info`,
`last_token_usage`, `total_token_usage`, and obvious usage fields.

## Total-to-Delta Handling

When only cumulative totals are available, calculate deltas within the same session. Skip
negative deltas and warn on suspiciously large deltas.

## Timestamp Handling

Prefer record timestamps. If a timestamp is missing, use safe metadata fallbacks and mark the
event as estimated.

## Fixture Requirements

Fixtures must be synthetic, sanitized, and free of prompts, responses, raw credentials, and
real local paths.
