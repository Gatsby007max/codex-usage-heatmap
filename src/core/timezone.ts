import { format } from "date-fns";

export function isValidDateKey(value: string | undefined): boolean {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function parseTimestamp(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function dateKeyFromTimestamp(timestamp: string, timezone = "local"): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  if (timezone === "UTC") {
    return date.toISOString().slice(0, 10);
  }

  if (timezone === "local" || !timezone) {
    return format(date, "yyyy-MM-dd");
  }

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    return format(date, "yyyy-MM-dd");
  }

  return format(date, "yyyy-MM-dd");
}

export function compareDateKey(date: string, since?: string, until?: string): boolean {
  if (since && date < since) {
    return false;
  }
  if (until && date > until) {
    return false;
  }
  return true;
}
