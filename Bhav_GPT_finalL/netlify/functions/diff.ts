import { Handler } from "@netlify/functions";
import { cors, preflight } from "./_shared/cors";
import { getText } from "./_shared/blob";
import { parseCsv } from "./lib-server/csv";
import { isHolidayIST, isWeekend, iso } from "./lib-server/holidays-in";

function prevTradingDay(dateIso: string){
  const [y,m,d] = dateIso.split("-").map(x=>+x);
  let cur = new Date(Date.UTC(y, m-1, d));
  for(let i=0;i<60;i++){
    cur = new Date(cur); cur.setUTCDate(cur.getUTCDate()-1);
    if(!isWeekend(cur) && !isHolidayIST(cur)) return iso(cur);
  }
  return dateIso;
}

function uniqueIsin(header: string[], rows: string[][]){
  const idx = header.findIndex(h => String(h).toUpperCase() === "ISIN");
  if(idx < 0) return 0;
  const seen = new Set<string>();
  for(const r of rows){ const k=(r[idx]||"").toUpperCase(); if(k) seen.add(k); }
  return seen.size;
}

function nullCounts(header: string[], rows: string[][]){
  const out: Record<string, number> = {};
  for(let i=0;i<header.length;i++){
    let c = 0;
    for(const r of rows){ if(!r[i] || String(r[i]).trim()==="") c++; }
    out[header[i]||`col${i}`] = c;
  }
  return out;
}

export const handler: Handler = async (event) => {
  const pf = preflight(event); if(pf) return pf;
  const { headers } = cors(event);
  try{
    const date = (event.queryStringParameters?.date || "").trim();
    if(!date) throw new Error("date required");
    const prev = prevTradingDay(date);

    const currCsv = await getText(`outputs/${date}/all_mkt.csv`) || "";
    const prevCsv = await getText(`outputs/${prev}/all_mkt.csv`) || "";

    const currParsed = parseCsv(currCsv);
    const prevParsed = parseCsv(prevCsv);

    const res = {
      currentDate: date,
      previousDate: prev,
      rowsCurrent: currParsed.rows.length,
      rowsPrev: prevParsed.rows.length,
      uniqueIsinCurrent: uniqueIsin(currParsed.header, currParsed.rows),
      uniqueIsinPrev: uniqueIsin(prevParsed.header, prevParsed.rows),
      nullCountsCurrent: nullCounts(currParsed.header, currParsed.rows),
      nullCountsPrev: nullCounts(prevParsed.header, prevParsed.rows)
    };
    return { statusCode: 200, headers: { ...headers, "content-type":"application/json" }, body: JSON.stringify(res) };
  }catch(e:any){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e?.message || String(e) }) };
  }
}
