// Display helpers for the tank countdown, shared by the Home and Fuel
// screens so both describe the same forecast the same way.

// The status pill for a days-until-fill-up forecast (null = unknown).
export function fuelStatusLabel(daysUntilFillUp: number | null): string {
  if (daysUntilFillUp === null) {
    return "Log a fill-up";
  }

  return daysUntilFillUp <= 3 ? "Refill soon" : daysUntilFillUp <= 7 ? "Monitor this week" : "On track";
}

// "4.2 days", or "—" when the forecast is unknown.
export function formatDaysUntilFillUp(daysUntilFillUp: number | null): string {
  return daysUntilFillUp === null ? "—" : `${Math.max(daysUntilFillUp, 0).toFixed(1)} days`;
}
