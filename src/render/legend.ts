import type { HeatmapTheme } from "./themes.js";

export function renderSvgLegend(theme: HeatmapTheme, x: number, y: number): string {
  const cellSize = 11;
  const gap = 3;
  const cells = theme.cells
    .map(
      (color, index) =>
        `<rect x="${x + 32 + index * (cellSize + gap)}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"><title>Level ${index}</title></rect>`
    )
    .join("");
  return `<g aria-label="Usage legend"><text x="${x}" y="${y + 10}" font-size="10" fill="${theme.mutedText}">Less</text>${cells}<text x="${x + 32 + 5 * (cellSize + gap) + 2}" y="${y + 10}" font-size="10" fill="${theme.mutedText}">More</text></g>`;
}
