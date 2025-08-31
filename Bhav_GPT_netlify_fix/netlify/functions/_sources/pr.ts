import JSZip from "jszip";
export async function extractPR(bytes: Uint8Array, yyyymmdd: string){
  const zip = await JSZip.loadAsync(bytes);
  const pat = new RegExp(`^.*Bc${yyyymmdd}\\.csv$`, "i");
  const entry = Object.values(zip.files).find(f => !f.dir && pat.test(f.name));
  if(!entry) throw new Error("Bc{YYYYMMDD}.csv not found");
  const txt = await (entry as any).async("string");
  return txt;
}
