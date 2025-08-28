import { todayIST, toYYYYMMDD, toDDMMYY, toAMFI } from "./_lib/dates.js";
import { fetchNSEZip, fetchBSECsv, fetchPRZip, fetchAMFI } from "./_lib/fetchers.js";
import { parseNSECsv, parseBSECsv, parsePRCsv, parseAMFI as parseAMFIFile } from "./_lib/parsers.js";
import { mergeRows, header } from "./_lib/merge.js";
import { toCsv } from "./_lib/csv.js";
import { putArtifact, loadIsinList } from "./_lib/blobs.js";
import { sendEmailSummary } from "./_lib/email.js";

export const config = { schedule: "30 11 * * *" }; // 5 PM IST

export default async () => {
  const ymd = todayIST();
  const yyyymmdd = toYYYYMMDD(ymd);
  const ddmmyy = toDDMMYY(ymd);
  const amfiDate = toAMFI(ymd);

  let log = [];
  try{
    const { isins } = await loadIsinList();
    const allowedSet = new Set(isins || []);
    log.push(`Daily run for ${ymd}. ISIN filter size=${allowedSet.size}`);

    let nseCsvText="", nseRows=[];
    try{ nseCsvText = await fetchNSEZip(yyyymmdd); nseRows = parseNSECsv(nseCsvText, ymd);
      await putArtifact(`daily/${ymd}/BhavCopy_NSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`, nseCsvText, "text/csv");
      log.push(`NSE rows: ${nseRows.length}`);
    }catch(e){ log.push(`NSE fail: ${e.message}`); }

    let bseCsvText="", bseRows=[];
    try{ bseCsvText = await fetchBSECsv(yyyymmdd); bseRows = parseBSECsv(bseCsvText, ymd);
      await putArtifact(`daily/${ymd}/BhavCopy_BSE_CM_0_0_0_${yyyymmdd}_F_0000.csv`, bseCsvText, "text/csv");
      log.push(`BSE rows: ${bseRows.length}`);
    }catch(e){ log.push(`BSE fail: ${e.message}`); }

    try{ const pr = await fetchPRZip(ddmmyy);
      await putArtifact(`daily/${ymd}/${pr.name}`, parsePRCsv(pr.content), "text/csv");
      log.push(`PR ok: ${pr.name}`);
    }catch(e){ log.push(`PR fail: ${e.message}`); }

    let amfiText="", amfiRows=[];
    try{ amfiText = await fetchAMFI(amfiDate);
      amfiRows = parseAMFIFile(amfiText, ymd, allowedSet);
      await putArtifact(`daily/${ymd}/AMFI_${ymd}.txt`, amfiText, "text/plain");
      log.push(`AMFI rows: ${amfiRows.length}`);
    }catch(e){ log.push(`AMFI fail: ${e.message}`); }

    const nseIsins = new Set(nseRows.map(r=>r.ISIN).filter(Boolean));
    const bseUniques = bseRows.filter(r=> r.ISIN && !nseIsins.has(r.ISIN));
    log.push(`BSE uniques: ${bseUniques.length}`);

    const merged = mergeRows({ nse: nseRows, bse: bseUniques, amfi: amfiRows });
    const finalCsv = toCsv(merged, header());
    const finalName = `daily/${ymd}/BhavCopy_ALL_MKT_CM_0_0_0_${yyyymmdd}_F_0000.csv`;
    const finalUrl = await putArtifact(finalName, finalCsv, "text/csv");
    log.push(`Merged rows: ${merged.length}`);
    log.push(`Final: ${finalUrl}`);

    const emailTo = "dinesh.konapure@validusfintech.com";
    await sendEmailSummary({
      to: emailTo,
      subject: `[ALL_MKT] ${ymd} build complete`,
      html: `<p>${log.join("<br/>")}</p><p><a href="${finalUrl}">Download merged</a></p>`
    }).catch(()=>{});

    return { statusCode: 200, body: "OK" };
  }catch(e){
    log.push(`ERROR: ${e.message}`);
    await sendEmailSummary({
      to: "dinesh.konapure@validusfintech.com",
      subject: `[ALL_MKT] ${ymd} build FAILED`,
      html: `<pre>${log.join("\n")}</pre>`
    }).catch(()=>{});
    return { statusCode: 500, body: e.message };
  }
};
