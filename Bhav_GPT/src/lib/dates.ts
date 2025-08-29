// Bhav_GPT/src/lib/dates.ts
// IST utilities + trading-day helpers used in App.tsx

export const IST_OFFSET_MIN = 5.5 * 60; // +05:30

// Return a Date object representing "now" in IST (clock-correct for any viewer timezone)
export function nowInIST(): Date {
  const now = new Date();
  const localOffsetMin = now.getTimezoneOffset(); // minutes behind UTC (e.g. IST = -330, UTC = 0, New York = +240)
  // Convert local time to IST by adding the delta between IST and local offset
  const deltaMin = IST_OFFSET_MIN + localOffsetMin;
  return new Date(now.getTime() + deltaMin * 60 * 1000);
}

// Format a Date as YYYY-MM-DD (UTC-based slice is fine for date-only usage in our app)
export function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Weekend check (treating the passed Date as UTC midnight)
export function isWeekend(d: Date): boolean {
  const day = d.getUTCDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

// Compute the latest trading day using an IST-aware cutoff (default 17:15 IST)
export function latestTradingDay(ist: Date, cutoffHour = 17, cutoffMin = 15): Date {
  // Start from IST calendar date at 00:00Z equivalence to make weekend math simple
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  const beforeCutoff =
    ist.getHours() < cutoffHour ||
    (ist.getHours() === cutoffHour && ist.getMinutes() < cutoffMin);

  // If before cutoff, use previous day
  if (beforeCutoff) d.setUTCDate(d.getUTCDate() - 1);

  // Roll back to Friday if we landed on weekend
  while (isWeekend(d)) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}
