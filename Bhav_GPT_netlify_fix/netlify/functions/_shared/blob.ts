import { getStore } from "@netlify/blobs";
export function store(){ return getStore({ name:"bhav-gpt-store" }); }
export async function putText(key: string, text: string){ const s=store(); await s.set(key, text, { contentType:"text/plain; charset=utf-8" }); return key; }
export async function putBytes(key: string, bytes: Uint8Array, contentType="application/octet-stream"){ const s=store(); await s.set(key, bytes, { contentType }); return key; }
export async function getText(key: string){ const s=store(); return await s.get(key); }
export async function getBytes(key: string){ const s=store(); const arr = await s.get(key, { type:"arrayBuffer" }); return arr ? new Uint8Array(arr) : null; }
export async function list(prefix=""){ const s=store(); return (await s.list({ prefix })).blobs; }
