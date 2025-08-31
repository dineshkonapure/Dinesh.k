import { Handler } from "@netlify/functions";
import { cors, preflight } from "./_shared/cors.ts";
import { getText } from "./_shared/blob.ts";
import { makeZip } from "./lib-server/zip.ts";
export const handler: Handler = async (event) => {
  const pf = preflight(event); if(pf) return pf;
  const { headers } = cors(event);
  try{
    const date = (event.queryStringParameters?.date || "").trim();
    if(!date) throw new Error("date required");
    const mode = event.queryStringParameters?.mode || "";
    const files = {
      "all_mkt.csv": await getText(`outputs/${date}/all_mkt.csv`) || "",
      "nse.csv": await getText(`outputs/${date}/nse.csv`) || "",
      "bse.csv": await getText(`outputs/${date}/bse.csv`) || "",
      "amfi_as_all.csv": await getText(`outputs/${date}/amfi_as_all.csv`) || "",
      "manifest.json": await getText(`manifests/${date}.json`) || "{}"
    };
    if(mode === "tabs"){ return { statusCode:200, headers:{ ...headers, "content-type":"application/json" }, body: JSON.stringify({ ok:true, files }) }; }
    const zip = await makeZip(files);
    return { statusCode:200, headers:{ ...headers, "content-type":"application/zip", "content-disposition":`attachment; filename="bhav_all_${date}.zip"` }, body: Buffer.from(zip).toString("base64"), isBase64Encoded:true };
  }catch(e:any){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e?.message||String(e) }) };
  }
}
