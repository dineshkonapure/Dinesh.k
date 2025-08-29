
import { toAMFI } from "./_lib/dates.js";
import { fetchAMFI } from "./_lib/fetchers.js";
import { parseAMFI as parseAMFIFile } from "./_lib/parsers.js";
import { normalizeIsinList } from "./_lib/isin.js";
import { toCsv } from "./_lib/csv.js";
import { header as headerFn } from "./_lib/merge.js";

export const handler = async (event)=>{
  const log = [];
  try{
    const body = event.body ? JSON.parse(event.body) : {};
    const ymd = body.date;
    const rawIsins = body.isins || "";
    if(!ymd) return json(200,{ ok:false, message:"date required"});
    const amfiDate = toAMFI(ymd);
    const { valid } = normalizeIsinList(rawIsins);
    const allowedSet = new Set(valid);

    const text = await fetchAMFI(amfiDate);
    log.push("AMFI fetched");
    const rows = parseAMFIFile(text, ymd, allowedSet);
    const csv = toCsv(rows, headerFn());
    const csvB64 = Buffer.from(csv).toString("base64");
    return json(200,{ ok:true, fileName:`AMFI_${ymd}.csv`, csvB64, rows, log });
  }catch(e){
    log.push("ERROR: "+(e?.message||e));
    return json(200,{ ok:false, message:String(e?.message||e), log });
  }
};
function json(status, obj){ return { statusCode:status, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(obj) }; }
