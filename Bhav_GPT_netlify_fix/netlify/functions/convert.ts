import { Handler } from "@netlify/functions";
import { cors, preflight } from "./_shared/cors.ts";
import { putText, getBytes } from "./_shared/blob.ts";
import { writeManifest } from "./_shared/manifest.ts";
import { parseNseCsv } from "./_sources/nse.ts";
import { parseBseCsv } from "./_sources/bse.ts";
import { parseAmfiToAllMkt } from "./_sources/amfi.ts";
import { parseCsv, toCsv } from "./lib-server/csv.ts";
import JSZip from "jszip";
import { mergeByISIN } from "./lib-server/mergeByISIN.ts";

function fmtDDMMMYYYY(date: string){
  const [y,m,d] = date.split("-").map(x=>+x);
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(y,m-1,d)).replace(/ /g,"-");
}

export const handler: Handler = async (event) => {
  const pf = preflight(event); if(pf) return pf;
  const { headers } = cors(event);
  try{
    const date = (event.queryStringParameters?.date || "").trim();
    if(!date) throw new Error("date required");
    const amfiBytes = await getBytes(`sources/${date}/amfi.txt`);
    const nseZip = await getBytes(`sources/${date}/nse.zip`);
    const bseCsv = await getBytes(`sources/${date}/bse.csv`);

    const ddmmy = fmtDDMMMYYYY(date);
    let amfiAll = { header:[], rows:[] as string[][] };
    if(amfiBytes){ const txt = new TextDecoder().decode(amfiBytes); amfiAll = parseAmfiToAllMkt(txt, ddmmy); }

    let nse = { header:[], rows:[] as string[][] };
    if(nseZip){
      const zip = await JSZip.loadAsync(nseZip);
      const csvEntry = Object.values(zip.files).find(f => !f.dir && /\.csv$/i.test(f.name));
      if(!csvEntry) throw new Error("NSE ZIP missing CSV");
      const txt = await (csvEntry as any).async("string");
      nse = parseNseCsv(txt);
    }

    let bse = { header:[], rows:[] as string[][] };
    if(bseCsv){ const txt = new TextDecoder().decode(bseCsv); bse = parseBseCsv(txt); }

    const header = nse.header.length ? nse.header : (bse.header.length ? bse.header : amfiAll.header);
    const merged = mergeByISIN(header, nse.rows, bse.rows, amfiAll.rows);

    const filesOut = [
      ["outputs/"+date+"/all_mkt.csv", toCsv(header, merged)],
      ["outputs/"+date+"/nse.csv", toCsv(nse.header, nse.rows)],
      ["outputs/"+date+"/bse.csv", toCsv(bse.header, bse.rows)],
      ["outputs/"+date+"/amfi_as_all.csv", toCsv(amfiAll.header, amfiAll.rows)]
    ] as const;
    for(const [k,v] of filesOut){ await putText(k, v); }

    const manifestUrl = await writeManifest(date, { date, files: filesOut.map(x=>x[0]), allRows: merged.length });
    return { statusCode:200, headers:{ ...headers, "content-type":"application/json" }, body: JSON.stringify({ ok:true, date, files: filesOut.map(f=>f[0]), allRows: merged.length, manifestUrl }) };
  }catch(e:any){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e?.message||String(e) }) };
  }
}
