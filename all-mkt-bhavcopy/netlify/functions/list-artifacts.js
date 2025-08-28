import { listArtifacts } from "./_lib/blobs.js";
export const handler = async (event)=>{
  const date = event.queryStringParameters?.date;
  if(!date) return res(400,"date?");
  const objs = await listArtifacts(`daily/${date}/`);
  return json(200, { items: objs.map(o=>({ key:o.key, size:o.size, lastModified:o.lastModified })) });
};
function res(s,b){return {statusCode:s,body:b}}
function json(s,o){return{statusCode:s,headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}}
