const ALLOWED = new Set(["https://bhav-gpt.netlify.app"]);
export function cors(event: any){
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const allowed = ALLOWED.has(origin) ? origin : "";
  const headers: Record<string,string> = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Vary": "Origin"
  };
  if(allowed) headers["Access-Control-Allow-Origin"] = allowed;
  return { headers, allowed: !!allowed };
}
export function preflight(event: any){
  if(event.httpMethod === "OPTIONS"){
    const { headers } = cors(event);
    return { statusCode: 204, headers, body: "" };
  }
  return null;
}
