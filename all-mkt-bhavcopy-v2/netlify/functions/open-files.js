
import { toYYYYMMDD, toDDMMYY, toAMFI } from "./_lib/dates.js";
import { fetchNSEZip, fetchBSECsv, fetchPRZip, fetchAMFI } from "./_lib/fetchers.js";

export const handler = async (event)=>{
  try{
    const ymd = event.queryStringParameters?.date;
    const src = (event.queryStringParameters?.src || "").toLowerCase();
    if(!ymd || !src) return res(400, "Missing date or src");
    if(!["nse","bse","pr","amfi"].includes(src)) return res(400,"Invalid src");

    const yyyymmdd = toYYYYMMDD(ymd);
    const ddmmyy = toDDMMYY(ymd);
    const amfiDate = toAMFI(ymd);

    if(src==="nse"){
      const csv = await fetchNSEZip(yyyymmdd);
      return file(csv, `BhavCopy_NSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`, "text/csv");
    } else if(src==="bse"){
      const csv = await fetchBSECsv(yyyymmdd);
      return file(csv, `BhavCopy_BSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`, "text/csv");
    } else if(src==="pr"){
      const pr = await fetchPRZip(ddmmyy);
      return file(pr.content, pr.name, "text/csv");
    } else {
      const txt = await fetchAMFI(amfiDate);
      return file(txt, `AMFI_${ymd}.txt`, "text/plain");
    }
  }catch(e){
    return res(200, "ERROR: "+e.message);
  }
};
function res(status, body){ return { statusCode: status, body }; }
function file(content, name, type){
  return { statusCode:200, headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${name}"` }, body: content };
}
