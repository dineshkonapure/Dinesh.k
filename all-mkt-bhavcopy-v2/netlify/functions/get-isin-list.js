
import { loadIsinList } from "./_lib/blobs.js";
export const handler = async ()=> {
  try{
    const js = await loadIsinList();
    return { statusCode:200, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(js) };
  }catch(e){
    return { statusCode:200, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ isins:[], error: e.message }) };
  }
};
