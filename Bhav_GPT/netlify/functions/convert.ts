import { type Context } from "@netlify/functions";
import JSZip from "jszip";
import { store, keyFor, urls } from "./_shared.ts";
import { parseCsv, toCsv, ALL_MKT_HEADER, amfiToAllMktRows, mergeByISIN } from "./lib-server.ts";

export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  const u = new URL(req.url);
  const dateStr = u.searchParams.get("date")!;
  const target = u.searchParams.get("target") as "amfi"|"all_mkt"|"pr_extracted";
  if (!dateStr || !target) return res400("Missing date or target");
  const d = new Date(dateStr + "T00:00:00Z");

  if (target === "pr_extracted") {
    const k = keyFor("original", "pr", d, "zip");
    const zipBuf = await ensureOriginal(d, "pr", k);
    const zip = await JSZip.loadAsync(zipBuf);
    const file = Object.values(zip.files).find(f => !f.dir && /^PR.*\.CSV$/i.test(f.name)) || Object.values(zip.files).find(f => !f.dir);
    if (!file) return res(422, "PR zip had no CSV");
    const csv = await file.async("string");
    const keyOut = keyFor("processed", "pr_extracted", d, "csv");
    await store.set(keyOut, csv, { metadata: { date: dateStr } });
    return new Response(csv, { headers: { "Content-Type": "text/csv", ...cors() } });
  }

  if (target === "amfi") {
    const k = keyFor("original", "amfi", d, "txt");
    const raw = await ensureOriginal(d, "amfi", k, "amfi");
    const { header, rows } = parseCsv(raw);
    const table = amfiToAllMktRows(rows, header); // builds rows incl header
    const csv = table.map(r => r.join(",")).join("\r\n");
    const name = `BhavCopy_AMFI_CM_0_0_0_${dateStr.replace(/-/g,'')}_F_0000.csv`; // preserve naming
    const keyOut = keyFor("processed", "amfi_as_all_mkt", d, "csv");
    await store.set(keyOut, csv, { metadata: { date: dateStr, name } });
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${name}`, ...cors() } });
  }

  // all_mkt
  const nse = await getCsvFromOriginal(d, "nse", "zip"); // CSV inside zip
  const bse = await getCsvFromOriginal(d, "bse", "csv");
  // AMFI -> rows shaped like ALL_MKT
  const amfiText = await ensureOriginal(d, "amfi", keyFor("original", "amfi", d, "txt"), "amfi");
  const { header: amfiH, rows: amfiR } = parseCsv(amfiText);
  const amfiRows = amfiToAllMktRows(amfiR, amfiH).slice(1); // skip header
  const header = nse.header.length ? nse.header : (bse.header.length ? bse.header : ALL_MKT_HEADER);
  const merged = mergeByISIN(header, nse.rows, bse.rows, amfiRows);
  const outCsv = toCsv(header, merged);
  const name = `BhavCopy_ALL_MKT_CM_0_0_0_${dateStr.replace(/-/g,'')}_F_0000.csv`;
  await store.set(keyFor("processed", "all_mkt", d, "csv"), outCsv, { metadata: { date: dateStr, name } });

  return new Response(outCsv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${name}`, ...cors() } });
};

async function ensureOriginal(d: Date, src: "amfi"|"nse"|"bse"|"pr", key: string, forceText?: "amfi") {
  const existing = await store.get(key);
  if (existing) return existing;
  // fetch on-demand from vendor
  const { amfi, nse, bse, pr } = urls(d);
  const url = src === "amfi" ? amfi : src === "nse" ? nse : src === "bse" ? bse : pr;
  const r = await fetch(url, { headers: { "User-Agent": Netlify.env.get("VENDOR_USER_AGENT") ?? "BhavcopyNetlify/1.0" }});
  if (!r.ok) throw new Error(`Upstream ${src} HTTP ${r.status}`);
  const buf = forceText ? Buffer.from(await r.text(), "utf8") : Buffer.from(await r.arrayBuffer());
  await store.set(key, buf, { metadata: { source: src } });
  return buf;
}

async function getCsvFromOriginal(d: Date, src: "nse"|"bse", ext: "zip"|"csv") {
  const key = keyFor("original", src, d, ext);
  const buf = await ensureOriginal(d, src, key);
  if (ext === "csv") return parseCsv(new TextDecoder().decode(buf as ArrayBuffer));
  // unzip NSE to CSV
  const zip = await JSZip.loadAsync(buf as ArrayBuffer);
  const file = Object.values(zip.files).find(f => !f.dir && /\.csv$/i.test(f.name));
  if (!file) return { header: [], rows: [] };
  const txt = await file.async("string");
  return parseCsv(txt);
}

const res = (code: number, msg: string) => new Response(msg, { status: code, headers: cors() });
const res400 = (m: string) => res(400, m);
const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
});
