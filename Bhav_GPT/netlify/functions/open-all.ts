import { type Context } from "@netlify/functions";
import JSZip from "jszip";
import { store, urls, keyFor } from "./_shared.ts";

export default async (req: Request, _ctx: Context) => {
  const u = new URL(req.url);
  const dateStr = u.searchParams.get("date")!;
  const type = u.searchParams.get("type") ?? "original"; // original|processed
  const mode = u.searchParams.get("mode") ?? "zip"; // tabs|zip
  const d = new Date(dateStr + "T00:00:00Z");
  const uObj = urls(d);

  if (mode === "tabs") {
    const links = type === "original" ? [uObj.amfi, uObj.nse, uObj.bse, uObj.pr] : await processedLinks(d);
    return json({ date: dateStr, links });
  }

  // zip mode
  const zip = new JSZip();
  const items = type === "original"
    ? await originals(d)
    : await processed(d);

  for (const it of items) zip.file(it.name, it.bytes);
  const out = await zip.generateAsync({ type: "uint8array" });
  return new Response(out, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename=BhavCopy_${type}_${dateStr}.zip`, ...cors() }});
};

async function originals(d: Date) {
  const keys = [
    keyFor("original", "amfi", d, "txt"),
    keyFor("original", "nse",  d, "zip"),
    keyFor("original", "bse",  d, "csv"),
    keyFor("original", "pr",   d, "zip"),
  ];
  const names = ["AMFI.txt","NSE.zip","BSE.csv","PR.zip"];
  const out: {name:string, bytes:Uint8Array}[] = [];
  for (let i=0;i<keys.length;i++){
    const buf = await store.get(keys[i]);
    if (buf) out.push({ name: names[i], bytes: new Uint8Array(buf as ArrayBuffer) });
  }
  return out;
}

async function processed(d: Date) {
  const out: {name:string, bytes:Uint8Array}[] = [];
  const candidates = [
    { key: keyFor("processed", "amfi_as_all_mkt", d, "csv"), name: `BhavCopy_AMFI_CM_0_0_0_${yyyymmdd(d)}_F_0000.csv` },
    { key: keyFor("processed", "all_mkt", d, "csv"), name: `BhavCopy_ALL_MKT_CM_0_0_0_${yyyymmdd(d)}_F_0000.csv` },
    { key: keyFor("processed", "pr_extracted", d, "csv"), name: `PR_${yyyymmdd(d)}.csv` }
  ];
  for (const c of candidates) {
    const buf = await store.get(c.key);
    if (buf) out.push({ name: c.name, bytes: new Uint8Array(buf as ArrayBuffer) });
  }
  return out;
}
function yyyymmdd(d: Date){ return d.toISOString().slice(0,10).replace(/-/g,""); }
async function processedLinks(d: Date) {
  // In this design we stream processed files from our functions
  return [
    `/api/convert?date=${d.toISOString().slice(0,10)}&target=amfi`,
    `/api/convert?date=${d.toISOString().slice(0,10)}&target=all_mkt`,
    `/api/convert?date=${d.toISOString().slice(0,10)}&target=pr_extracted`
  ];
}
const json = (o: unknown) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json", ...cors() }});
const cors = () => ({ "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" });
