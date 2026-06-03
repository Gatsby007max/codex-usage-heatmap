# Codex Usage Heatmap Agent Guide

## Project Overview

Codex Usage Heatmap is a local-only Node.js and TypeScript CLI that scans local Codex
JSONL logs, extracts token usage metadata, aggregates usage by day, and renders a
GitHub-style heatmap as JSON, CSV, SVG, and static HTML.

## Repository Layout

- `src/cli.ts` wires the command line interface.
- `src/commands/` contains command handlers.
- `src/core/` contains discovery, privacy, reading, normalization, aggregation, and date logic.
- `src/parsers/` contains parser adapters for unstable Codex log shapes.
- `src/render/` contains SVG and HTML report rendering.
- `src/exporters/` contains JSON and CSV output.
- `fixtures/` contains sanitized test data only.
- `tests/` contains Vitest coverage for parsing, privacy, rendering, exports, and CLI smoke tests.
- `.agents/skills/codex-usage-heatmap/` contains the reusable Codex Skill for this project.

## Development Commands

- `pnpm dev doctor`
- `pnpm dev scan --json --source fixtures`
- `pnpm dev report --out ./codex-usage-report`
- `pnpm dev sample --out ./tmp/sample-report`

## Build, Test, and Lint

Always run:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm check:language`

## Privacy Rules

- Do not read, print, store, or snapshot credentials.
- Do not read `auth.json`, `.env`, cookies, private keys, token stores, or credential-like files.
- Do not include prompt text or response text in reports, snapshots, warnings, or fixtures.
- Do not store raw JSONL lines.
- Do not add network calls by default.
- Redact local absolute paths by default.

## Parser Rules

- Treat Codex log schemas as unstable.
- Prefer parser adapters over hard-coded global assumptions.
- Continue after malformed JSONL lines.
- Convert cumulative totals to deltas only within the same session.
- Skip negative deltas.
- Mark estimated events with an explicit estimation mode.

## Documentation Rules

- Keep public repository content English-only.
- Document conservative assumptions in README limitations.
- Keep examples sanitized and reproducible.

## Language Policy

All public repository files must be English-only. Run `pnpm check:language` before
completion. The check fails on Japanese Hiragana, Katakana, or CJK ideographs.

## Release Expectations

- Run full verification.
- Generate the sample report.
- Review package contents with a dry run before publishing.
- Confirm generated reports contain only aggregated data.

## Done Definition

The project is done when the CLI builds, tests pass, language checks pass, sample output is
generated, privacy safeguards are covered, and README instructions are enough for a new user
to install and run the tool.
