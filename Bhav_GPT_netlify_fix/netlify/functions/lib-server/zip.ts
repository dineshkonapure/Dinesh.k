import JSZip from "jszip";
export async function makeZip(files: Record<string, string|Uint8Array>){
  const zip = new JSZip();
  for(const [name, data] of Object.entries(files)){ zip.file(name, data as any); }
  return await zip.generateAsync({ type:"uint8array" });
}
