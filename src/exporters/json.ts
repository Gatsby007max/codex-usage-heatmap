import type { DailyUsage } from "../types.js";

export function exportJson(days: DailyUsage[], pretty = false): string {
  return `${JSON.stringify(days, null, pretty ? 2 : 0)}\n`;
}
