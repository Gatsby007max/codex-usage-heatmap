import type { ThemeName } from "../types.js";

export interface HeatmapTheme {
  name: ThemeName;
  background: string;
  text: string;
  mutedText: string;
  border: string;
  card: string;
  cells: [string, string, string, string, string];
}

export const themes: Record<ThemeName, HeatmapTheme> = {
  github: {
    name: "github",
    background: "#ffffff",
    text: "#24292f",
    mutedText: "#57606a",
    border: "#d0d7de",
    card: "#f6f8fa",
    cells: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]
  },
  dark: {
    name: "dark",
    background: "#0d1117",
    text: "#e6edf3",
    mutedText: "#8b949e",
    border: "#30363d",
    card: "#161b22",
    cells: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"]
  },
  blue: {
    name: "blue",
    background: "#ffffff",
    text: "#1f2937",
    mutedText: "#4b5563",
    border: "#bfdbfe",
    card: "#eff6ff",
    cells: ["#e5e7eb", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"]
  },
  gray: {
    name: "gray",
    background: "#ffffff",
    text: "#1f2937",
    mutedText: "#4b5563",
    border: "#d1d5db",
    card: "#f9fafb",
    cells: ["#f3f4f6", "#d1d5db", "#9ca3af", "#6b7280", "#374151"]
  }
};

export function getTheme(name: ThemeName = "github"): HeatmapTheme {
  return themes[name] ?? themes.github;
}
