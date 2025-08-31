import { Handler } from "@netlify/functions";
import { cors, preflight } from "./_shared/cors.ts";
import { putBytes } from "./_shared/blob.ts";
import Busboy from "busboy";

const MAX_TOTAL = 25 * 1024 * 1024;
const MAX_FILES = 50;
const ALLOWED_TYPES = new Set(["text/plain","text/csv","application/zip","application/x-zip-compressed"]);
const ALLOWED_EXT = new Set([".txt",".csv",".zip"]);
function sanitize(name: string){ return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0,140); }
function extOf(name: string){ const m = name.toLowerCase().match(/(\.[a-z0-9]+)$/); return m ? m[1] : ""; }

export const handler: Handler = async (event) => {
  const pf = preflight(event); if(pf) return pf;
  const { headers } = cors(event);
  if(event.httpMethod !== "POST"){ return { statusCode:405, headers, body:"Method Not Allowed" }; }
  if(!event.isBase64Encoded || !event.body){ return { statusCode:400, headers, body:"Expected multipart/form-data" }; }
  const date = (event.queryStringParameters?.date || "").trim() || new Date().toISOString().slice(0,10);
  const bb = Busboy({ headers: event.headers as any });
  const results:any[]=[]; let total=0; let count=0; let aborted=false;
  const prom = new Promise<void>((resolve,reject)=>{
    bb.on("file",(name,file,info)=>{
      if(aborted){ file.resume(); return; }
      count++; if(count>MAX_FILES){ aborted=True; file.resume(); reject(new Error("Too many files")); return; }
      const filename = sanitize(info.filename || "upload.bin");
      const ext = extOf(filename);
      if(!ALLOWED_EXT.has(ext)){ aborted=true; file.resume(); reject(new Error("Disallowed file extension")); return; }
      if(info.mimeType && !ALLOWED_TYPES.has(info.mimeType)){ aborted=true; file.resume(); reject(new Error("Disallowed content-type")); return; }
      const chunks: Buffer[] = [];
      file.on("data",(d:Buffer)=>{ total += d.length; if(total>MAX_TOTAL){ aborted=true; reject(new Error("Payload too large")); file.resume(); return; } chunks.push(d); });
      file.on("end", async ()=>{ if(aborted) return; const buf = Buffer.concat(chunks); const key = `uploads/${date}/${filename}`; await putBytes(key, new Uint8Array(buf), info.mimeType || "application/octet-stream"); results.push({ key, size: buf.length, type: info.mimeType || "" }); });
    });
    bb.on("error", err => reject(err));
    bb.on("finish", () => resolve());
  });
  const bodyBuf = Buffer.from(event.body, "base64");
  bb.end(bodyBuf);
  try{
    await prom;
    return { statusCode:200, headers:{ ...headers, "content-type":"application/json" }, body: JSON.stringify({ ok:true, date, count: results.length, total, items: results }) };
  }catch(e:any){
    return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:e?.message||String(e) }) };
  }
}
