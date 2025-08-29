export const IST_OFFSET_MIN = 5.5 * 60;

export function nowInIST() {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MIN*60*1000 - now.getTimezoneOffset()*60*1000);
}
export function fmt_yyyy_mm_dd(d: Date){ return d.toISOString().slice(0,10); }
