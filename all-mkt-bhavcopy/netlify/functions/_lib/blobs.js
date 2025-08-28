import { getStore } from "@netlify/blobs";

const ARTIFACTS = "artifacts";
const CONFIG = "config";

export async function putArtifact(path, content, contentType="text/csv"){
  const store = getStore(ARTIFACTS);
  await store.set(path, content, { contentType, metadata: { createdAt: new Date().toISOString() }});
  const url = await store.getSignedUrl(path, { method:"GET", expiresIn: 60*60*24*7 });
  return url;
}
export async function getArtifact(path){
  const store = getStore(ARTIFACTS);
  return await store.get(path);
}
export async function listArtifacts(prefix){
  const store = getStore(ARTIFACTS);
  const list = await store.list({ prefix });
  return list.objects || [];
}

export async function saveIsinList(arr){
  const store = getStore(CONFIG);
  await store.set("amfi_isins.json", JSON.stringify({ isins: arr, updatedAt: new Date().toISOString() }), { contentType: "application/json" });
}
export async function loadIsinList(){
  const store = getStore(CONFIG);
  const text = await store.get("amfi_isins.json");
  if(!text) return { isins: [] };
  try{ return JSON.parse(text); } catch{ return { isins: [] }; }
}
