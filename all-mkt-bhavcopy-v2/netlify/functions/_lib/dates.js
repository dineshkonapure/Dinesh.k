
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
export const IST = "Asia/Kolkata";
export function todayIST(){ return formatInTimeZone(new Date(), IST, "yyyy-MM-dd"); }
export function ymdToIST(ymd){ return formatInTimeZone(parseISO(ymd), IST, "yyyy-MM-dd"); }
export function toDDMMYYYY(ymd){ return formatInTimeZone(parseISO(ymd), IST, "dd-MM-yyyy"); }
export function toYYYYMMDD(ymd){ return formatInTimeZone(parseISO(ymd), IST, "yyyyMMdd"); }
export function toDDMMYY(ymd){ return formatInTimeZone(parseISO(ymd), IST, "ddMMyy"); }
export function toAMFI(ymd){ return formatInTimeZone(parseISO(ymd), IST, "dd-MMM-yyyy"); }
