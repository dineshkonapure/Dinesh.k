import { Handler } from "@netlify/functions";
import { cors, preflight } from "./_shared/cors.ts";
import { log } from "./_shared/log.ts";
import { putBytes } from "./_shared/blob.ts";
import { latestTradingDay } from "./lib-server/latestTradingDay.ts";

const URLS = {
  nse(d: string){ return `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${d}_F_0000.csv.zip`; },
  bse(d: string){ return `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${d}_F_0000.CSV`; },
  amfi(d: string){
    const [y,m,dd] = d.split("-").map(x=>+x);
    const month = new Date(Date.UTC(y, m-1, dd)).toLocaleString("en-US",{ month:"short" });
    return `https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt=${String(dd).padStart(2,"0")}-${month}-${y}&todt=${String(dd).padStart(2,"0")}-${month}-${y}`;
  },
  pr(d: string){
    const [y,m,dd] = d.split("-"); const yy = y.slice(-2);
    return `https://archives.nseindia.com/archives/equities/bhavcopy/pr/PR${dd}${m}${yy}.zip`;
  }
};

export const handler: Handler = async (event) => {
  const pf = preflight(event); if(pf) return pf;
  const { headers } = cors(event);
  try{
    const date = (event.queryStringParameters?.date || latestTradingDay()).trim();
    const tasks: [key:string, url:string, type:string][] = [
      [`sources/${date}/nse.zip`, URLS.nse(date), "application/zip"],
      [`sources/${date}/bse.csv`, URLS.bse(date), "text/csv"],
      [`sources/${date}/amfi.txt`, URLS.amfi(date), "text/plain"],
      [`sources/${date}/pr.zip`,  URLS.pr(date),  "application/zip"]
    ];
    for(const [key,url,ct] of tasks){
      log("fetch", url);
      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      await putBytes(key, buf, ct);
    }
    return { statusCode:200, headers:{ ...headers, "content-type":"application/json" }, body: JSON.stringify({ ok:true, date }) };
  }catch(e:any){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e?.message||String(e) }) };
  }
}
