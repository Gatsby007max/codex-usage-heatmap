#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != "Darwin" ]]; then
  printf 'Skipping macOS menu bar verification on non-Darwin host.\n'
  exit 0
fi

if [[ ! -f dist/cli.js ]]; then
  pnpm build
fi

output="$(
  CODEX_USAGE_SOURCE=fixtures \
  CODEX_USAGE_REPORT_DIR="$PWD/tmp/menu-bar-fixture-report" \
  ./scripts/run-macos-menu-bar.sh --once --debug
)"

printf '%s\n' "$output"

grep -q '"status" : "Ready"' <<< "$output"
grep -q '"lifetimeTokens"' <<< "$output"
grep -q '"peakDailyTokens"' <<< "$output"
grep -q '"topFeatures"' <<< "$output"
grep -q '"plugins"' <<< "$output"
grep -q 'fast mode' <<< "$output"

CODEX_USAGE_SOURCE=fixtures \
  CODEX_USAGE_REPORT_DIR="$PWD/tmp/menu-bar-fixture-report" \
  ./scripts/run-macos-menu-bar.sh --once >/dev/null

plutil -lint "macos/launcher/Codex Usage Heatmap.app/Contents/Info.plist"
