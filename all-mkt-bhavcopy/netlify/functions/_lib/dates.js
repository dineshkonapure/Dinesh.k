import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";

export const IST = "Asia/Kolkata";

export function todayIST(){
  const now = new Date();
  const ymd = formatInTimeZone(now, IST, "yyyy-MM-dd");
  return ymd;
}
export function ymdToIST(ymd){
  return formatInTimeZone(parseISO(ymd), IST, "yyyy-MM-dd");
}
export function toDDMMYYYY(ymd){
  const d = parseISO(ymd);
  return formatInTimeZone(d, IST, "dd-MM-yyyy");
}
export function toYYYYMMDD(ymd){
  const d = parseISO(ymd);
  return formatInTimeZone(d, IST, "yyyyMMdd");
}
export function toDDMMYY(ymd){
  const d = parseISO(ymd);
  return formatInTimeZone(d, IST, "ddMMyy");
}
export function toAMFI(ymd){
  const d = parseISO(ymd);
  return formatInTimeZone(d, IST, "dd-MMM-yyyy");
}
