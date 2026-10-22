// Calendar dates (YYYY-MM-DD) in a user's own time zone, so "today" and "this month" match their clock.

/** Returns the calendar date (YYYY-MM-DD) it is right now in the given IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: "year" | "month" | "day") =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Returns the first and last calendar dates of the month that contains the given date (YYYY-MM-DD). */
export function monthContaining(date: string): { from: string; to: string } {
  const [year = 0, month = 0] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthText = String(month).padStart(2, "0");
  return {
    from: `${String(year)}-${monthText}-01`,
    to: `${String(year)}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}
