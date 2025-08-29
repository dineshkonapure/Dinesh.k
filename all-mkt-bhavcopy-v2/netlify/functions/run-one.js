
import { toYYYYMMDD, toDDMMYY, toAMFI } from "./_lib/dates.js";
import { fetchNSEZip, fetchBSECsv, fetchPRZip, fetchAMFI } from "./_lib/fetchers.js";
import { parseNSECsv, parseBSECsv, parsePRCsv, parseAMFI as parseAMFIFile } from "./_lib/parsers.js";
import { mergeRows, header as headerFn } from "./_lib/merge.js";
import { toCsv } from "./_lib/csv.js";
import { normalizeIsinList } from "./_lib/isin.js";
import { putArtifact } from "./_lib/blobs.js";

export const handler = async (event)=>{
  const log = [];
  try{
    const body = event.body ? JSON.parse(event.body) : {};
    const ymd = body.date;
    const rawIsins = body.isins || "";
    const store = !!body.store;
    if(!ymd) return json(200,{ ok:false, message:"date required"});

    const yyyymmdd = toYYYYMMDD(ymd);
    const ddmmyy = toDDMMYY(ymd);
    const amfiDate = toAMFI(ymd);
    const { valid: allowedIsins } = normalizeIsinList(rawIsins);
    const allowedSet = new Set(allowedIsins);

    let nseCsvText="", bseCsvText="", prCsv="", amfiText="";
    let nseRows=[], bseRows=[], amfiRows=[];
    const files = [];

    try{ nseCsvText = await fetchNSEZip(yyyymmdd); nseRows = parseNSECsv(nseCsvText, ymd); log.push(`NSE rows: ${nseRows.length}`);
      if(store){ const name = `daily/${ymd}/BhavCopy_NSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`; files.push({ name:name.split("/").pop(), url: await putArtifact(name, nseCsvText, "text/csv") });}
    }catch(e){ log.push("NSE fail: "+e.message); }

    try{ bseCsvText = await fetchBSECsv(yyyymmdd); bseRows = parseBSECsv(bseCsvText, ymd); log.push(`BSE rows: ${bseRows.length}`);
      if(store){ const name = `daily/${ymd}/BhavCopy_BSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`; files.push({ name:name.split("/").pop(), url: await putArtifact(name, bseCsvText, "text/csv") });}
    }catch(e){ log.push("BSE fail: "+e.message); }

    try{ const pr = await fetchPRZip(ddmmyy); prCsv = parsePRCsv(pr.content); log.push(`PR ok: ${pr.name}`);
      if(store){ const name = `daily/${ymd}/${pr.name}`; files.push({ name: pr.name, url: await putArtifact(name, prCsv, "text/csv") });}
    }catch(e){ log.push("PR fail: "+e.message); }

    try{ amfiText = await fetchAMFI(amfiDate); amfiRows = parseAMFIFile(amfiText, ymd, allowedSet); log.push(`AMFI rows: ${amfiRows.length}`);
      if(store){ const name = `daily/${ymd}/AMFI_${ymd}.txt`; files.push({ name: `AMFI_${ymd}.txt`, url: await putArtifact(name, amfiText, "text/plain") });}
    }catch(e){ log.push("AMFI fail: "+e.message); }

    const merged = mergeRows({ nse: nseRows, bse: bseRows, amfi: amfiRows });
    const header = headerFn();
    const finalCsv = toCsv(merged, header);
    const fileName = `BhavCopy_ALL_MKT_CM_0_0_0_${yyyymmdd}_F_0000.csv`;
    if(store){ files.push({ name: fileName, url: await putArtifact(`daily/${ymd}/${fileName}`, finalCsv, "text/csv") }); }

    const csvB64 = Buffer.from(finalCsv).toString("base64");
    return json(200,{ ok:true, fileName, csvB64, rows: merged, files, log });
  }catch(e){
    log.push("ERROR: "+(e?.message||e));
    return json(200,{ ok:false, message:String(e?.message||e), log });
  }
};
function json(status, obj){ return { statusCode:status, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(obj) }; }
