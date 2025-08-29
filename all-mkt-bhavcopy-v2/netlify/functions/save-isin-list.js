
import { normalizeIsinList } from "./_lib/isin.js";
import { saveIsinList } from "./_lib/blobs.js";

export const handler = async (event)=>{
  try{
    const body = event.body ? JSON.parse(event.body) : {};
    const raw = body.isins || "";
    const { valid, invalid } = normalizeIsinList(raw);
    await saveIsinList(valid);
    return json(200, { ok:true, message:`Saved ${valid.length} ISIN(s). Invalid: ${invalid.join(", ")}` });
  }catch(e){
    return json(200, { ok:false, message:`Save failed: ${e.message}` });
  }
};
function json(status, obj){ return { statusCode:status, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(obj) }; }
