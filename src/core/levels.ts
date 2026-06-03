import type { DailyUsage, HeatmapLevel, LevelBasis } from "../types.js";

export function parseFixedThresholds(value: string): number[] {
  const thresholds = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part >= 0)
    .sort((a, b) => a - b);

  if (thresholds.length < 4) {
    throw new Error("Fixed level mode requires four comma-separated numeric thresholds.");
  }

  return thresholds.slice(0, 4);
}

export function calculateQuantileThresholds(values: number[]): number[] {
  const nonZero = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) {
    return [0, 0, 0, 0];
  }

  return [0.25, 0.5, 0.75, 1].map((quantile) => {
    const index = Math.min(nonZero.length - 1, Math.ceil(nonZero.length * quantile) - 1);
    return nonZero[Math.max(0, index)] ?? 0;
  });
}

export function levelForValue(value: number, thresholds: number[]): HeatmapLevel {
  if (value <= 0) {
    return 0;
  }

  if (value <= (thresholds[0] ?? 0)) {
    return 1;
  }
  if (value <= (thresholds[1] ?? 0)) {
    return 2;
  }
  if (value < (thresholds[2] ?? 0)) {
    return 3;
  }
  return 4;
}

export function assignLevels(
  days: DailyUsage[],
  basis: LevelBasis,
  fixedThresholds?: number[]
): DailyUsage[] {
  const thresholds =
    basis === "fixed"
      ? (fixedThresholds ?? [1000, 10000, 100000, 1000000])
      : calculateQuantileThresholds(days.map((day) => day.totalTokens));

  return days.map((day) => ({
    ...day,
    level: levelForValue(day.totalTokens, thresholds),
    levelBasis: basis
  }));
}
