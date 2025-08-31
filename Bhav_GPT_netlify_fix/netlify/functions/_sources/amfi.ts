import { parseCsv } from "../lib-server/csv.ts";
export const ALL_MKT_HEADER = ["TradDt","BizDt","Sgmt","Src","FinInstrmTp","FinInstrmId","ISIN","TckrSymb","SctySrs","XpryDt","FininstrmActlXpryDt","StrkPric","OptnTp","FinInstrmNm","OpnPric","HghPric","LwPric","ClsPric","LastPric","PrvsClsgPric","UndrlygPric","SttlmPric","OpnIntrst","ChngInOpnIntrst","TtlTradgVol","TtlTrfVal","TtlNbOfTxsExctd","SsnId","NewBrdLotQty","Rmks","Rsvd1","Rsvd2","Rsvd3","Rsvd4"];
function tickerFromName(name: string){ return (name||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12) || 'AMFIITEM'; }
export function parseAmfiToAllMkt(csvText: string, dateDDMMMYYYY: string){
  const { header, rows } = parseCsv(csvText);
  const h = header.map(x=>x.toLowerCase());
  const iDiv = h.findIndex(x=> x.includes('isin div') || x.includes('isin payout') || x.includes('isin growth'));
  const iRei = h.findIndex(x=> x.includes('reinvestment'));
  const iName= h.findIndex(x=> x.includes('scheme name'));
  const iNav = h.findIndex(x=> x.includes('net asset value') || x==='nav');
  const iDate= h.indexOf('date');
  const out: string[][] = [JSON.parse(JSON.stringify(ALL_MKT_HEADER))];
  const fmt = (d: Date) => new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(d).replace(/ /g,"-");
  for(const r of rows){
    const isin = (iDiv>=0 && r[iDiv]) ? r[iDiv] : (iRei>=0 ? r[iRei] : '');
    if(!isin) continue;
    const name = iName>=0 ? r[iName] : '';
    const nav  = iNav>=0  ? (r[iNav] || '')  : '';
    let ddmmy = dateDDMMMYYYY;
    if(iDate>=0 && r[iDate]){ const v=String(r[iDate]); const m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m) ddmmy = fmt(new Date(+m[1], +m[2]-1, +m[3])); }
    const sym = tickerFromName(name);
    const row = [ ddmmy, ddmmy, "CM", "AMFI", "MF", "", isin, sym, "MF", "", "", "", "", name, nav, nav, nav, nav, nav, "", "", nav, "", "", "", "", "", "F1", "1", "", "", "", "" ];
    out.push(row);
  }
  return { header: out[0], rows: out.slice(1) };
}
