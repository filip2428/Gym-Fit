import { format, isPast, parseISO } from "date-fns";

/** Accepts an ISO string, a Date, or null/undefined. */
type DateInput = string | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  return typeof value === "string" ? parseISO(value) : value;
}

/** e.g. "Mon, Jun 30, 2025 · 6:30 PM" */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, "EEE, MMM d, yyyy · h:mm a");
}

/** e.g. "Jun 30, 2025" */
export function formatDate(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, "MMM d, yyyy");
}

export function isExpired(value: DateInput): boolean {
  const d = toDate(value);
  return d ? isPast(d) : false;
}
