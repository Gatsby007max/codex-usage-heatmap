#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p tmp/macos-menu-bar

if [[ ! -f dist/cli.js ]]; then
  pnpm build
fi

swiftc \
  -module-cache-path tmp/macos-menu-bar/module-cache \
  macos/CodexUsageMenuBar.swift \
  -o tmp/macos-menu-bar/CodexUsageMenuBar

export CODEX_USAGE_HEATMAP_REPO_ROOT="${CODEX_USAGE_HEATMAP_REPO_ROOT:-$PWD}"
export CODEX_USAGE_HEATMAP_CLI="${CODEX_USAGE_HEATMAP_CLI:-$PWD/dist/cli.js}"
export CODEX_USAGE_REPORT_DIR="${CODEX_USAGE_REPORT_DIR:-$PWD/tmp/menu-bar-report}"

exec "$PWD/tmp/macos-menu-bar/CodexUsageMenuBar" "$@"
