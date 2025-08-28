import { getStore } from "@netlify/blobs";

const ARTIFACTS = "artifacts";
const CONFIG = "config";

export async function putArtifact(path, content, contentType="text/csv"){
  const store = getStore(ARTIFACTS);
await store.set(path, content, {
metadata: { contentType, createdAt: new Date().toISOString() }
});
// Serve via our Function so links don’t expire and we control headers
return `/.netlify/functions/download?path=${encodeURIComponent(path)}`;
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
