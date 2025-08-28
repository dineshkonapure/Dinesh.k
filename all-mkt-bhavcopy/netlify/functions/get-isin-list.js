import { loadIsinList } from "./_lib/blobs.js";
export const handler = async ()=> {
  const js = await loadIsinList();
  return { statusCode:200, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(js) };
};
