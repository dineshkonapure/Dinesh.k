
import { getStore } from "@netlify/blobs";
const ARTIFACTS = "artifacts";
const CONFIG = "config";
function isProd(){ return !!process.env.NETLIFY; }
const mem = new Map();

export async function putArtifact(path, content, contentType="text/csv"){
  try{
    if(isProd()){
      const store = getStore(ARTIFACTS);
      await store.set(path, content, { metadata: { contentType, createdAt: new Date().toISOString() }});
      return `/.netlify/functions/download?path=${encodeURIComponent(path)}`;
    } else {
      mem.set(path, String(content));
      return `/.netlify/functions/download?path=${encodeURIComponent(path)}`;
    }
  }catch(e){
    console.error("putArtifact error:", e);
    mem.set(path, String(content));
    return `/.netlify/functions/download?path=${encodeURIComponent(path)}`;
  }
}
export async function getArtifact(path){
  try{
    if(isProd()){ const store=getStore(ARTIFACTS); return await store.get(path); }
    return mem.get(path) ?? null;
  }catch(e){ console.error("getArtifact error:",e); return null; }
}
export async function listArtifacts(prefix){
  try{
    if(isProd()){ const store=getStore(ARTIFACTS); const list=await store.list({ prefix }); return list.objects||[]; }
    const out=[]; for(const k of mem.keys()){ if(k.startsWith(prefix)) out.push({ key:k, size:(mem.get(k)||"").length }); } return out;
  }catch(e){ console.error("listArtifacts error:",e); return []; }
}
export async function saveIsinList(arr){
  try{
    if(isProd()){ const store=getStore(CONFIG); await store.set("amfi_isins.json", JSON.stringify({ isins:arr, updatedAt:new Date().toISOString() }), { metadata:{ contentType:"application/json" }}); }
    else { mem.set("config/amfi_isins.json", JSON.stringify({ isins:arr, updatedAt:new Date().toISOString() })); }
  }catch(e){ console.error("saveIsinList error:",e); }
}
export async function loadIsinList(){
  try{
    if(isProd()){ const store=getStore(CONFIG); const text=await store.get("amfi_isins.json"); if(!text) return { isins:[] }; try{ return JSON.parse(text);}catch{ return { isins:[] }; } }
    const text = mem.get("config/amfi_isins.json"); if(!text) return { isins:[] }; try{ return JSON.parse(text);}catch{ return { isins:[] }; }
  }catch(e){ console.error("loadIsinList error:",e); return { isins:[] }; }
}
