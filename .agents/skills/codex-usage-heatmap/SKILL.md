---
name: codex-usage-heatmap
description: Use this skill when developing, debugging, extending, releasing, or using the codex-usage-heatmap project, a local-only Codex token usage scanner and GitHub-style heatmap generator. Trigger for Codex usage logs, token usage visualization, heatmap reports, parser adapters, privacy-safe log analysis, fixtures, or release checks.
---

# Codex Usage Heatmap Skill

## Purpose

Help maintain, debug, extend, release, and operate the codex-usage-heatmap project safely.

## Non-negotiable Rules

- Never read or print auth.json, API keys, refresh tokens, access tokens, cookies, .env values, private keys, or credentials.
- Never include prompt text or model response text in generated reports.
- Never store raw logs.
- Treat Codex local log schemas as unstable.
- Prefer parser adapters and sanitized fixtures over hard-coded assumptions.
- Keep the tool local-only by default.
- Do not add network calls unless explicitly requested and documentation is updated.
- Keep all public repository content English-only.
- Before completing code changes, run:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm check:language`

## Common Workflows

### Add Support for a New Codex Log Shape

1. Add a sanitized fixture under `fixtures/`.
2. Add or update a parser adapter in `src/parsers/`.
3. Normalize into `NormalizedUsageEvent`.
4. Add tests for:
   - valid event
   - missing timestamp
   - malformed line
   - no prompt or response leakage
   - no credential leakage
5. Run verification commands.

### Debug Missing Usage

1. Run `pnpm dev doctor`.
2. Confirm discovered paths.
3. Confirm readable JSONL count.
4. Confirm usage event count.
5. Inspect only keys and metadata, not message content.
6. Add a sanitized fixture for the observed structure if safe.

### Prepare a Release

1. Run full checks.
2. Generate sample report.
3. Confirm README commands work.
4. Confirm no generated report contains local absolute paths by default.
5. Confirm npm package files are limited using package.json `files`.
6. Update `CHANGELOG.md` if needed.

## Output Format for Codex

When making changes to this project, summarize:

- changed files
- tests run
- privacy/security impact
- known limitations
- follow-up recommendations
