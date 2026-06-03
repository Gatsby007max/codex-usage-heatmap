# Contributing

## Setup

```bash
pnpm install
```

## Development Commands

```bash
pnpm dev doctor
pnpm dev scan --json --source fixtures
pnpm dev report --out ./codex-usage-report
pnpm dev sample --out ./tmp/sample-report
```

## Test Requirements

Run before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:language
```

## Parser Adapter Guidelines

- Add parser adapters for new log shapes.
- Keep parser logic conservative and schema-tolerant.
- Normalize into `NormalizedUsageEvent`.
- Do not preserve raw records.
- Log field names only when diagnostics are needed.

## Fixture Sanitization Rules

- Use synthetic records only.
- Do not include real prompts.
- Do not include real responses.
- Do not include real credentials.
- Include malformed and no-usage examples when changing parsing behavior.

## Language Policy

Public repository files must be English-only. `pnpm check:language` fails on Japanese
Hiragana, Katakana, or CJK ideographs.

## Pull Request Checklist

- Tests cover behavior changes.
- Fixtures are sanitized.
- Reports contain aggregated data only.
- No network calls were added by default.
- Documentation and limitations were updated.
- Full verification passes.
