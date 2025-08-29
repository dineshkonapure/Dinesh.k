// Minimal CSV parse/emit (same logic as your HTML for fidelity)
export function parseCsv(txt: string) {
  const out: string[][] = [];
  let row: string[] = [], f = "", i = 0, q = false;
  while (i < txt.length) {
    const c = txt[i++];
    if (q) { if (c === '"') { if (txt[i] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else { if (c === '"') q = true; else if (c === ',') { row.push(f); f = ""; } else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i] === '\n') i++; if (row.length || f.length) { row.push(f); out.push(row); } row = []; f = ""; } else f += c; }
  }
  if (f.length || row.length) { row.push(f); out.push(row); }
  if (!out.length) return { header: [] as string[], rows: [] as string[][] };
  const header = out.shift() || [];
  return { header, rows: out };
}

export function toCsv(header: string[], rows: string[][]) {
  const esc = (s: unknown) => /[",\n\r]/.test(String(s ?? "")) ? `"${String(s ?? "").replace(/"/g, '""')}"` : String(s ?? "");
  const lines = [header.map(esc).join(",")];
  for (const r of rows) lines.push(r.map(esc).join(","));
  return lines.join("\r\n");
}

// Preserved from your HTML
export const ALL_MKT_HEADER = ["TradDt","BizDt","Sgmt","Src","FinInstrmTp","FinInstrmId","ISIN","TckrSymb","SctySrs","XpryDt","FininstrmActlXpryDt","StrkPric","OptnTp","FinInstrmNm","OpnPric","HghPric","LwPric","ClsPric","LastPric","PrvsClsgPric","UndrlygPric","SttlmPric","OpnIntrst","ChngInOpnIntrst","TtlTradgVol","TtlTrfVal","TtlNbOfTxsExctd","SsnId","NewBrdLotQty","Rmks","Rsvd1","Rsvd2","Rsvd3","Rsvd4"] // :contentReference[oaicite:11]{index=11}

const tickerFromName = (name: string) => String(name || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,12) || "AMFIITEM"; // :contentReference[oaicite:12]{index=12}

export function amfiToAllMktRows(rows: string[][], header: string[]) {
  const h = header.map(x => x.toLowerCase());
  const iDiv = h.findIndex(x=> x.includes("isin div") || x.includes("isin payout") || x.includes("isin growth"));
  const iRei = h.findIndex(x=> x.includes("reinvestment"));
  const iName= h.findIndex(x=> x.includes("scheme name"));
  const iNav = h.findIndex(x=> x.includes("net asset value") || x==="nav");
  const iDate= h.indexOf("date");

  const out: string[][] = [ALL_MKT_HEADER.slice()];
  rows.forEach(r=>{
    const isin = (iDiv>=0 && r[iDiv]) ? r[iDiv] : (iRei>=0 ? (r[iRei]||"") : "");
    if(!isin) return;
    const name = iName>=0 ? (r[iName]||"") : "";
    const nav  = iNav>=0  ? (r[iNav] || "")  : "";
    // Use AMFI date if present; else caller date will be applied in frontend display
    const ddmmy = iDate>=0 && r[iDate] ? r[iDate] : "";
    const sym = tickerFromName(name);
    const row = [
      ddmmy, ddmmy, "CM", "AMFI", "MF", "", isin, sym, "MF", "", "", "", "", name,
      nav, nav, nav, nav, nav, "", "", nav, "", "", "", "", "", "F1", "1", "", "", "", ""
    ];
    out.push(row);
  });
  return out;
}

export function mergeByISIN(header: string[], nseRows: string[][], bseRows: string[][], amfiRows: string[][]) {
  const isinIdx = header.findIndex(h => String(h).toUpperCase() === "ISIN");
  if (isinIdx < 0) return [...nseRows, ...bseRows, ...amfiRows]; // fallback
  const seen = new Set<string>(), out: string[][] = [];
  const add = (r: string[]) => { const k=(r[isinIdx]||"").toUpperCase(); if(!k || seen.has(k)) return; seen.add(k); out.push(r); };
  nseRows.forEach(add); bseRows.forEach(add); amfiRows.forEach(add);
  return out;
}
