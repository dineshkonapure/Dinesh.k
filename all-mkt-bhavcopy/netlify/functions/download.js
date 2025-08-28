import { getArtifact } from "./_lib/blobs.js";
export const handler = async (event)=>{
  const date = event.queryStringParameters?.date;
  const file = event.queryStringParameters?.file;
  if(!date || !file) return { statusCode:400, body:"Missing" };
  const path = `daily/${date}/${file}`;
  const content = await getArtifact(path);
  if(!content) return { statusCode:404, body:"Not found" };
  const type = file.endsWith(".csv")? "text/csv" : (file.endsWith(".txt")?"text/plain":"application/octet-stream");
  return { statusCode:200, headers:{ "Content-Type": type, "Content-Disposition": `attachment; filename="${file}"` }, body: content };
};
