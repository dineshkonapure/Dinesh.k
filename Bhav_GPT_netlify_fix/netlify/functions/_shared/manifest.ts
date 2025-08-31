import { putText } from "./blob.ts";
export async function writeManifest(dateKey: string, payload: any){
  const key = `manifests/${dateKey}.json`;
  await putText(key, JSON.stringify({ ...payload, writtenAt:new Date().toISOString() }, null, 2));
  return `/.netlify/functions/open-all?date=${dateKey}&manifest=1`;
}
