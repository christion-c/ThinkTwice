import type { DailyDrivingLog, SavedFillUpHistoryEntry } from "@/lib/api/backend";
import { getLocalDateString } from "@/lib/local-date";

export interface ChartPoint {
  label: string;
  value: number;
  // Marks the bar the chart should emphasize (today, the latest fill-up).
  highlight?: boolean;
}

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short" });

// Miles driven per day for the last `days` calendar days, oldest first,
// ending on `today`. Days without a log are 0 rather than skipped so the
// chart keeps an even day-by-day axis, and multiple logs on one day
// (one per vehicle) are summed.
export function dailyMilesSeries(logs: DailyDrivingLog[], days: number, today = new Date()): ChartPoint[] {
  const milesByDate = new Map<string, number>();
  for (const log of logs) {
    milesByDate.set(log.logDate, (milesByDate.get(log.logDate) ?? 0) + log.milesDriven);
  }

  const points: ChartPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    points.push({
      label: weekdayFormat.format(date).slice(0, 2),
      value: milesByDate.get(getLocalDateString(date)) ?? 0,
      highlight: offset === 0,
    });
  }

  return points;
}

// Cost of the most recent `count` fill-ups, oldest first so the chart
// reads left-to-right in time, with the newest one highlighted.
export function fillUpCostSeries(history: SavedFillUpHistoryEntry[], count: number): ChartPoint[] {
  const recent = [...history]
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
    .slice(-count);

  return recent.map((entry, index) => {
    const date = new Date(entry.recordedAt);
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      value: entry.observedCost,
      highlight: index === recent.length - 1,
    };
  });
}

// Share of `total` that `value` represents, as a whole percent clamped
// to 0-100 - for legend captions and progress bars, where a negative or
// >100% share (e.g. spending over income) shouldn't break the layout.
export function percentOf(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(Math.max(Math.round((value / total) * 100), 0), 100);
}
