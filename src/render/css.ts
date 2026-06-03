import type { HeatmapTheme } from "./themes.js";

export function renderCss(theme: HeatmapTheme): string {
  return `
:root {
  color-scheme: light dark;
  --bg: ${theme.background};
  --text: ${theme.text};
  --muted: ${theme.mutedText};
  --border: ${theme.border};
  --card: ${theme.card};
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --text: #e6edf3;
    --muted: #8b949e;
    --border: #30363d;
    --card: #161b22;
  }
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
}
main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 20px 48px;
}
h1 {
  margin: 0;
  font-size: 32px;
}
h2 {
  margin-top: 32px;
  font-size: 20px;
}
.subtitle,
.muted {
  color: var(--muted);
}
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin: 24px 0;
}
.card {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 8px;
  padding: 14px;
}
.label {
  color: var(--muted);
  font-size: 12px;
}
.value {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 700;
}
.heatmap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th,
td {
  border-bottom: 1px solid var(--border);
  padding: 8px;
  text-align: left;
}
.notice {
  border-left: 4px solid var(--border);
  padding: 10px 12px;
  background: var(--card);
}
.sr-summary {
  margin-top: 20px;
}
code {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 4px;
}
`;
}
