export function mergeByISIN(header: string[], nseRows: string[][], bseRows: string[][], amfiRows: string[][]){
  const isinIdx = header.findIndex(h => String(h).toUpperCase() === "ISIN");
  if(isinIdx < 0){ return [...nseRows, ...bseRows, ...amfiRows]; }
  const seen = new Set<string>(), out: string[][] = [];
  const add = (r: string[]) => { const k=(r[isinIdx]||"").toUpperCase(); if(!k || seen.has(k)) return; seen.add(k); out.push(r); };
  nseRows.forEach(add);
  bseRows.forEach(add);
  amfiRows.forEach(r => out.push(r)); // no dedupe against exchanges per spec
  return out;
}
