// Bhav_GPT/netlify/functions/_shared.ts
import { getStore } from "@netlify/blobs";

export const store = getStore("bhavcopy"); // Blob store namespace

export type Source = "amfi" | "nse" | "bse" | "pr";

export function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export function ddmmyy(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

function ddmmmYYYY(d: Date): string {
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()];
  return `${String(d.getUTCDate()).padStart(2, "0")}-${M}-${d.getUTCFullYear()}`;
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

export function keyFor(
  kind: "original" | "processed",
  src: Source | string,
  date: Date,
  ext: string
) {
  const ymd = yyyymmdd(date);
  return `${kind}/${src}/${ymd}.${ext}`;
}

export function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}
