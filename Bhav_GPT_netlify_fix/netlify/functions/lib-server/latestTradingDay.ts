import { isHolidayIST, isWeekend, toISTDateOnly, iso } from "./holidays-in.ts";
export function latestTradingDay(cutoffHour=17, cutoffMinute=15, overrideHolidays: Set<string>|null=null){
  const today = toISTDateOnly(new Date());
  const now = new Date(new Date().toLocaleString('en-US',{ timeZone:'Asia/Kolkata' }));
  const cutoff = new Date(today); cutoff.setUTCHours(cutoffHour-5, cutoffMinute-30, 0, 0); // approx shift
  let d = today;
  const isTrading = (x: Date) => !isWeekend(x) && !isHolidayIST(x, overrideHolidays);
  if(isTrading(today) && now >= cutoff) return iso(today);
  for(let i=0;i<30;i++){ d = new Date(d); d.setUTCDate(d.getUTCDate()-1); if(isTrading(d)) return iso(d); }
  return iso(today);
}
