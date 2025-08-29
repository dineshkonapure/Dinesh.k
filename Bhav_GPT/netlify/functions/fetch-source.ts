import { type Context } from "@netlify/functions";
import { store, urls, keyFor } from "./_shared.ts";

export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  const u = new URL(req.url);
  const dateStr = u.searchParams.get("date")!;
  const source = u.searchParams.get("source") as "amfi"|"nse"|"bse"|"pr";
  if (!dateStr || !source) return res400("Missing date or source");

  const d = new Date(dateStr + "T00:00:00Z"); // date-only
  const srcUrl = urls(d)[source];

  const r = await fetch(srcUrl, {
    headers: {
      // option: set UA to avoid blocks
      "User-Agent": Netlify.env.get("VENDOR_USER_AGENT") ?? "BhavcopyNetlify/1.0"
    },
    redirect: "follow",
    cache: "no-store"
  });
  if (!r.ok) return res(r.status, `Upstream ${source} HTTP ${r.status}`);

  const buf = await r.arrayBuffer();
  const ext = source === "amfi" ? "txt" : (source === "bse" ? "csv" : "zip");
  const key = keyFor("original", source, d, ext);
  await store.set(key, Buffer.from(buf), { metadata: { source, date: dateStr, url: srcUrl } });

  return new Response(buf, {
    headers: { "Content-Type": r.headers.get("Content-Type") ?? contentTypeFor(ext), ...cors() }
  });
};

const contentTypeFor = (ext: string) =>
  ext === "csv" ? "text/csv" : ext === "zip" ? "application/zip" : "text/plain; charset=utf-8";

const res = (code: number, msg: string) => new Response(msg, { status: code, headers: cors() });
const res400 = (m: string) => res(400, m);
const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
});
