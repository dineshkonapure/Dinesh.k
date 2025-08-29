
import { getArtifact } from "./_lib/blobs.js";
export const handler = async (event)=>{
  const qs = event.queryStringParameters || {};
  const path = qs.path || (qs.date && qs.file ? `daily/${qs.date}/${qs.file}` : null);
  if(!path) return { statusCode:400, body:"Missing path or date+file" };
  const content = await getArtifact(path);
  if(!content) return { statusCode:404, body:"Not found" };
  const file = decodeURIComponent(path.split("/").pop());
  const type = file.endsWith(".csv")? "text/csv" : (file.endsWith(".txt")?"text/plain":"application/octet-stream");
  const body = typeof content === "string" ? content : Buffer.from(content).toString();
  return { statusCode:200, headers:{ "Content-Type": type, "Content-Disposition": `attachment; filename="${file}"` }, body };
};
