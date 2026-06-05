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

app_dir="${CODEX_USAGE_MENU_APP_DIR:-$HOME/Desktop/Codex Usage Heatmap.app}"
contents_dir="$app_dir/Contents"
macos_dir="$contents_dir/MacOS"
resources_dir="$contents_dir/Resources"

mkdir -p "$macos_dir" "$resources_dir"
cp "macos/launcher/Codex Usage Heatmap.app/Contents/Info.plist" "$contents_dir/Info.plist"
cp tmp/macos-menu-bar/CodexUsageMenuBar "$macos_dir/CodexUsageMenuBar"

cat > "$resources_dir/config.json" <<EOF
{
  "cliPath": "$PWD/dist/cli.js",
  "repoRoot": "$PWD",
  "defaultReportDir": "$PWD/tmp/menu-bar-report"
}
EOF

printf 'Installed %s\n' "$app_dir"
