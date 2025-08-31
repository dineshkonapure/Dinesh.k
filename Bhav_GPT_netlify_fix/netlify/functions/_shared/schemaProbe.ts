import crypto from "node:crypto";
export function headerHash(header: string[]): string{ return crypto.createHash("sha256").update(header.join("|")).digest("hex").slice(0,16); }
export function assertHas(header: string[], must: string[]){
  const lower = header.map(h=>h.toLowerCase());
  for(const m of must){ if(!lower.some(h=>h.includes(m.toLowerCase()))) throw new Error(`Missing header ~"${m}"`); }
  return true;
}
