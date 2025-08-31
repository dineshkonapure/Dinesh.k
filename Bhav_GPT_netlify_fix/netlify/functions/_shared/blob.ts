import { getStore } from "@netlify/blobs";

// Resilient Blobs store creation:
// - In production on Netlify Functions, getStore({ name }) works automatically.
// - In local/dev or detached envs, pass siteID & token from env vars.
//   Supported vars:
//     NETLIFY_SITE_ID or SITE_ID or BLOBS_SITE_ID
//     NETLIFY_API_TOKEN or NETLIFY_BEARER_TOKEN or BLOBS_TOKEN
//
// Tip (local): run `netlify dev --blobs` OR set the env vars above.
export function store(){
  const name = "bhav-gpt-store";
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID;
  const token  = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_BEARER_TOKEN || process.env.BLOBS_TOKEN;
  if(siteID && token){
    return getStore({ name, siteID, token });
  }
  return getStore({ name });
}

export async function putText(key: string, text: string){
  const s = store();
  await s.set(key, text, { contentType: "text/plain; charset=utf-8" });
  return key;
}

export async function putBytes(key: string, bytes: Uint8Array, contentType="application/octet-stream"){
  const s = store();
  await s.set(key, bytes, { contentType });
  return key;
}

export async function getText(key: string){
  const s = store();
  return await s.get(key);
}

export async function getBytes(key: string){
  const s = store();
  const arr = await s.get(key, { type: "arrayBuffer" });
  return arr ? new Uint8Array(arr) : null;
}

export async function list(prefix=""){
  const s = store();
  return (await s.list({ prefix })).blobs;
}
