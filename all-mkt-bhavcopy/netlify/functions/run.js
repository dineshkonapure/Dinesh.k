import { ymdToIST, toYYYYMMDD, toDDMMYY, toAMFI } from "./_lib/dates.js";
import { fetchNSEZip, fetchBSECsv, fetchPRZip, fetchAMFI } from "./_lib/fetchers.js";
import { parseNSECsv, parseBSECsv, parsePRCsv, parseAMFI as parseAMFIFile } from "./_lib/parsers.js";
import { mergeRows, header } from "./_lib/merge.js";
import { toCsv } from "./_lib/csv.js";
import { normalizeIsinList } from "./_lib/isin.js";
import { putArtifact } from "./_lib/blobs.js";

export const handler = async (event)=>{
  try{
    const body = event.body ? JSON.parse(event.body) : {};
    let dates = Array.isArray(body.dates) ? body.dates : [];
    const rawIsins = body.isins || "";
    if(dates.length===0){ return resp(400,{ message:"No dates selected" }); }

    const uniq = Array.from(new Set(dates.map(ymdToIST)));
    const { valid: allowedIsins, invalid } = normalizeIsinList(rawIsins);

    let allFiles = [];
    let previewRows = [];
    let logs = [];

    for(const ymd of uniq){
      const yyyymmdd = toYYYYMMDD(ymd);
      const ddmmyy = toDDMMYY(ymd);
      const amfiDate = toAMFI(ymd);

      logs.push(`Processing ${ymd} …`);

      let nseCsvText="", bseCsvText="", prCsvObj=null, amfiText="";
      let nseRows=[], bseRows=[], amfiRows=[];

      try{
        nseCsvText = await fetchNSEZip(yyyymmdd);
        nseRows = parseNSECsv(nseCsvText, ymd);
        logs.push(`NSE rows: ${nseRows.length}`);
        const nseName = `daily/${ymd}/BhavCopy_NSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`;
        const nseUrl = await putArtifact(nseName, nseCsvText, "text/csv");
        allFiles.push({ name: nseName.split("/").pop(), url: nseUrl });
      } catch(e){ logs.push(`NSE fetch failed: ${e.message}`); }

      try{
        bseCsvText = await fetchBSECsv(yyyymmdd);
        bseRows = parseBSECsv(bseCsvText, ymd);
        logs.push(`BSE rows: ${bseRows.length}`);
        const bseName = `daily/${ymd}/BhavCopy_BSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`;
        const bseUrl = await putArtifact(bseName, bseCsvText, "text/csv");
        allFiles.push({ name: bseName.split("/").pop(), url: bseUrl });
      } catch(e){ logs.push(`BSE fetch failed: ${e.message}`); }

      try{
        prCsvObj = await fetchPRZip(ddmmyy);
        const bcName = `daily/${ymd}/${prCsvObj.name}`;
        const bcUrl = await putArtifact(bcName, parsePRCsv(prCsvObj.content), "text/csv");
        allFiles.push({ name: prCsvObj.name, url: bcUrl });
        logs.push(`PR extracted: ${prCsvObj.name}`);
      } catch(e){ logs.push(`PR fetch failed: ${e.message}`); }

      try{
        amfiText = await fetchAMFI(amfiDate);
        const allowedSet = new Set(allowedIsins);
        amfiRows = parseAMFIFile(amfiText, ymd, allowedSet);
        logs.push(`AMFI rows: ${amfiRows.length} (filter size=${allowedIsins.length})`);
        const amfiName = `daily/${ymd}/AMFI_${ymd}.txt`;
        const amfiUrl = await putArtifact(amfiName, amfiText, "text/plain");
        allFiles.push({ name: `AMFI_${ymd}.txt`, url: amfiUrl });
      } catch(e){ logs.push(`AMFI fetch failed: ${e.message}`); }

      const nseIsins = new Set(nseRows.map(r=>r.ISIN).filter(Boolean));
      const bseUniques = bseRows.filter(r=> r.ISIN && !nseIsins.has(r.ISIN));
      logs.push(`BSE uniques added: ${bseUniques.length}`);

      const merged = mergeRows({ nse: nseRows, bse: bseUniques, amfi: amfiRows });
      logs.push(`Merged rows: ${merged.length}`);

      const finalCsv = toCsv(merged, header());
      const finalName = `daily/${ymd}/BhavCopy_ALL_MKT_CM_0_0_0_${yyyymmdd}_F_0000.csv`;
      const finalUrl = await putArtifact(finalName, finalCsv, "text/csv");
      allFiles.push({ name: finalName.split("/").pop(), url: finalUrl });

      previewRows = previewRows.concat(merged.slice(0,10));
    }

    return resp(200, {
      message: "Completed",
      files: allFiles,
      previewRows,
      invalidIsins: invalid,
      log: logs.join("\n")
    });
  }catch(e){
    return resp(500, { message: "Error", error: e.message });
  }
};

function resp(status, body){
  return { statusCode: status, headers: { "Content-Type":"application/json" }, body: JSON.stringify(body) };
}
