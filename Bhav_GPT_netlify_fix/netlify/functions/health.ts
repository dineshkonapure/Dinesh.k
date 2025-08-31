import { Handler } from "@netlify/functions";
export const handler: Handler = async (event) => {
  const secret = process.env.HEALTH_SECRET || "";
  const verbose = event.queryStringParameters?.secret && event.queryStringParameters.secret === secret;
  const body = verbose ? { ok:true, env:Object.keys(process.env).filter(k=>k.startsWith("NETLIFY_")), time:new Date().toISOString() } : { ok:true };
  return { statusCode:200, headers:{"content-type":"application/json"}, body: JSON.stringify(body) };
}
