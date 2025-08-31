import { Handler } from "@netlify/functions";
import { list } from "./_shared/blob.ts";
export const handler: Handler = async (event) => {
  const secret = process.env.HEALTH_SECRET || "";
  if(!event.queryStringParameters || event.queryStringParameters.secret !== secret){ return { statusCode:401, body:"Unauthorized" }; }
  const prefix = (event.queryStringParameters?.prefix || "").trim();
  const blobs = await list(prefix);
  return { statusCode:200, headers:{ "content-type":"application/json" }, body: JSON.stringify({ ok:true, prefix, items: blobs.map(b=>({ key:b.key, size:b.size, sha:b.sha })), count: blobs.length }) };
}
