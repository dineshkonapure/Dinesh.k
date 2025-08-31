export const HOLIDAYS = new Set<string>([
  "2024-01-26","2024-03-25","2024-03-29","2024-04-11","2024-05-01","2024-06-17","2024-08-15","2024-10-02","2024-11-01","2024-12-25",
  "2025-02-26","2025-03-14","2025-04-10","2025-04-14","2025-04-18","2025-05-01","2025-06-17","2025-07-17","2025-08-15","2025-08-27","2025-10-02","2025-10-21","2025-11-05","2025-12-25",
  "2026-01-26","2026-03-19","2026-03-29","2026-04-14","2026-05-01","2026-08-15","2026-10-02","2026-11-11","2026-12-25"
]);
export function isWeekend(d: Date){ const w=d.getUTCDay(); return w===0 || w===6; }
export function toISTDateOnly(d: Date){ const t=new Date(d.toLocaleString("en-US",{ timeZone:"Asia/Kolkata" })); return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())); }
export function iso(d: Date){ return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`; }
export function isHolidayIST(d: Date, overrides: Set<string>|null=null){ const day=iso(d); return (overrides && overrides.has(day)) || HOLIDAYS.has(day); }
