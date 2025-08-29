import { getStore } from "@netlify/blobs";

export const store = getStore("bhavcopy"); // namespace

export type Source = "amfi" | "nse" | "bse" | "pr";

export function yyyymmdd(d: Date) {
  return d.toISOString().slice(0,10).replace(/-/g,"");
}
export function ddmmyy(d: Date) {
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

export function urls(d: Date) {
  const YYYYMMDD = yyyymmdd(d);
  const DDMMYY = ddmmyy(d);
  return {
    amfi: `https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt=${ddmmmYYYY(d)}&todt=${ddmmmYYYY(d)}`,
    nse:  `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${YYYYMMDD}_F_0000.csv.zip`,
    bse:  `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${YYYYMMDD}_F_0000.CSV`,
    pr:   `https://archives.nseindia.com/archives/equities/bhavcopy/pr/PR${DDMMYY}.zip`,
  };
}
// AMFI expects DD-MMM-YYYY
function ddmmmYYYY(d: Date){
  const MMM = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  return `${String(d.getDate()).padStart(2,'0')}-${MMM}-${d.getFullYear()}`;
}

export function keyFor(kind: "original"|"processed", src: Source|string, date: Date, ext: string) {
  const ymd = yyyymmdd(date);
  return `${kind}/${src}/${ymd}.${ext}`;
}

export function ok(res: Response, origin = "*") {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return new Response(res.body, { ...res, headers: h });
}

export async function readBlob(key: string) {
  const b = await store.get(key, { type: "stream" });
  if (!b) return null;
  return b;
}
