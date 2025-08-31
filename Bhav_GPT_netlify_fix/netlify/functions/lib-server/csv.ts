export function parseCsv(txt: string): { header: string[]; rows: string[][] }{
  const out: string[][] = []; let row: string[] = [], f = "", i=0, q=false;
  while(i<txt.length){
    const c = txt[i++];
    if(q){ if(c === '"'){ if(txt[i] === '"'){ f+='"'; i++; } else q=false; } else f+=c; }
    else { if(c === '"') q=true; else if(c === ","){ row.push(f); f=""; } else if(c === "\n" || c === "\r"){ if(c==="\r" && txt[i]==="\n") i++; if(row.length || f.length){ row.push(f); out.push(row); } row=[]; f=""; } else f+=c; }
  }
  if(f.length || row.length){ row.push(f); out.push(row); }
  if(!out.length) return { header: [], rows: [] };
  const header = out.shift() || [];
  return { header, rows: out };
}
export function toCsv(header: string[], rows: string[][]){
  const esc = (s:any) => /[",\n\r]/.test(String(s??"")) ? `"${String(s??"").replace(/"/g,'""')}"` : String(s??"");
  const lines = [header.map(esc).join(",")];
  for(const r of rows) lines.push(r.map(esc).join(","));
  return lines.join("\r\n");
}
