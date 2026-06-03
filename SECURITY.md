# Security Policy

## Supported Versions

The current `0.x` release line receives security fixes.

## Reporting Vulnerabilities

Please report vulnerabilities through the project issue tracker or the maintainer contact
listed by the repository owner. Do not include real credentials or private logs in reports.

## Privacy Design

Codex Usage Heatmap is local-only by default. It reads local JSONL log files, extracts token
usage metadata, aggregates the results, and writes local reports.

## Sensitive File Denylist

The scanner skips credential-like paths, including:

- `auth.json`
- `.env`
- private keys
- cookies
- token stores
- credential files
- sensitive configuration files

## Raw Log Handling Policy

The tool does not store raw logs, raw JSONL lines, prompts, or model responses. Warnings and
reports must not include raw payloads.

## Credential Handling Policy

The tool must never require, read, print, store, or validate OpenAI API keys or other
credentials.

## Network Policy

The CLI makes no network calls by default. Any future network behavior must be explicit,
documented, tested, and disabled by default.

## Generated Report Safety

Generated reports contain aggregated usage data only. Reports must not include prompts,
responses, credentials, raw logs, or absolute local paths unless a user explicitly opts into
path diagnostics outside the report.

## Responsible Disclosure Contact

Contact: security-contact@example.com
