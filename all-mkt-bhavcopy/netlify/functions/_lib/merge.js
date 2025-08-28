const HEADER = [
  "TradDt","BizDt","Sgmt","Src","FinInstrmTp","FinInstrmId","ISIN","TckrSymb","SctySrs",
  "XpryDt","FininstrmActlXpryDt","StrkPric","OptnTp","FinInstrmNm",
  "OpnPric","HghPric","LwPric","ClsPric","LastPric","PrvsClsgPric","UndrlygPric","SttlmPric",
  "OpnIntrst","ChngInOpnIntrst","TtlTradgVol","TtlTrfVal","TtlNbOfTxsExctd","SsnId","NewBrdLotQty","Rmks","Rsvd1","Rsvd2","Rsvd3","Rsvd4"
];

export function header(){ return HEADER.slice(); }

export function mergeRows({nse=[], bse=[], amfi=[]}){
  const key = (r)=> `${r.ISIN}|${r.TradDt}`;
  const out = new Map();
  const push = (arr)=>{ for(const r of arr){ if(!r.ISIN) continue; const k=key(r); if(!out.has(k)) out.set(k,r); } };
  push(nse); push(bse); push(amfi); // priority order
  return Array.from(out.values());
}
