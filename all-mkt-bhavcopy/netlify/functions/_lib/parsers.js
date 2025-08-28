import { parse } from "csv-parse/sync";
import { toDDMMYYYY } from "./dates.js";

export function parseNSECsv(csv, ymd){
  const rows = parse(csv, { columns:true, skip_empty_lines:true });
  const ddmmyyyy = toDDMMYYYY(ymd);
  return rows.map(r=>({
    TradDt: ddmmyyyy,
    BizDt: ddmmyyyy,
    Sgmt: "CM",
    Src: "NSE",
    FinInstrmTp: "STK",
    FinInstrmId: r.SYMBOL,
    ISIN: r.ISIN || "",
    TckrSymb: r.SYMBOL,
    SctySrs: r.SERIES || "",
    XpryDt: "", FininstrmActlXpryDt:"", StrkPric:"", OptnTp:"",
    FinInstrmNm: r.SECURITY || r.SYMBOL || "",
    OpnPric: r.OPEN || "", HghPric: r.HIGH || "", LwPric: r.LOW || "",
    ClsPric: r.CLOSE || "", LastPric: r.LAST || "", PrvsClsgPric: r.PREVCLOSE || "",
    UndrlygPric:"", SttlmPric:"",
    OpnIntrst:"", ChngInOpnIntrst:"",
    TtlTradgVol: r.TOTTRDQTY || "",
    TtlTrfVal: r.TOTTRDVAL || "",
    TtlNbOfTxsExctd: r.TOTALTRADES || "",
    SsnId: "F1", NewBrdLotQty: "1", Rmks:"", Rsvd1:"", Rsvd2:"", Rsvd3:"", Rsvd4:""
  }));
}

export function parseBSECsv(csv, ymd){
  const rows = parse(csv, { columns:true, skip_empty_lines:true });
  const ddmmyyyy = toDDMMYYYY(ymd);
  return rows.map(r=>{
    const get = (k)=> r[k] ?? r[k?.toUpperCase()] ?? r[k?.toLowerCase()];
    return {
      TradDt: ddmmyyyy,
      BizDt: ddmmyyyy,
      Sgmt: "CM",
      Src: "BSE",
      FinInstrmTp: "STK",
      FinInstrmId: get("SC_CODE") || "",
      ISIN: get("ISIN_CODE") || get("ISIN") || "",
      TckrSymb: (get("SC_NAME") || "").trim().replace(/\s+/g,"_").toUpperCase(),
      SctySrs: get("SC_TYPE") || "",
      XpryDt:"", FininstrmActlXpryDt:"", StrkPric:"", OptnTp:"",
      FinInstrmNm: get("SC_NAME") || "",
      OpnPric: get("OPEN") || "", HghPric: get("HIGH") || "", LwPric: get("LOW") || "",
      ClsPric: get("CLOSE") || "", LastPric: get("LAST") || get("CLOSE") || "",
      PrvsClsgPric: get("PREVCLOSE") || "",
      UndrlygPric:"", SttlmPric:"",
      OpnIntrst:"", ChngInOpnIntrst:"",
      TtlTradgVol: get("NO_OF_SHRS") || "",
      TtlTrfVal: get("NET_TURNOV") || "",
      TtlNbOfTxsExctd: get("NO_TRADES") || "",
      SsnId:"F1", NewBrdLotQty:"1", Rmks:"", Rsvd1:"", Rsvd2:"", Rsvd3:"", Rsvd4:""
    };
  });
}

export function parsePRCsv(csvText){
  return csvText;
}

export function parseAMFI(text, ymd, allowedSet){
  const ddmmyyyy = toDDMMYYYY(ymd);
  const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  let currentAMC = "";
  let rows = [];
  for(const line of lines){
    if(line.includes(";") && !/Scheme Code;Scheme Name;ISIN/i.test(line)){
      const parts = line.split(";");
      if(parts.length >= 8){
        const [code, schemeName, isinGrowth, isinReinv, nav, repurchase, sale, date] = parts;
        const isins = [isinGrowth, isinReinv].filter(Boolean);
        const includeIsins = allowedSet && allowedSet.size ? isins.filter(x=>allowedSet.has(x)) : isins;
        if(includeIsins.length===0 && allowedSet && allowedSet.size){ continue; }
        const navVal = nav?.trim() || "";
        const list = includeIsins.length ? includeIsins : [isins[0]];
        for(const isin of list){
          rows.push({
            TradDt: ddmmyyyy,
            BizDt: ddmmyyyy,
            Sgmt: "CM",
            Src: "AMFI",
            FinInstrmTp: "STK",
            FinInstrmId: code || "",
            ISIN: isin || "",
            TckrSymb: (currentAMC?.split(/\s+/)[0] || "MF").toUpperCase() + "_MF",
            SctySrs: "MF",
            XpryDt:"", FininstrmActlXpryDt:"", StrkPric:"", OptnTp:"",
            FinInstrmNm: (schemeName || "").trim(),
            OpnPric: navVal, HghPric: navVal, LwPric: navVal, ClsPric: navVal,
            LastPric: navVal, PrvsClsgPric: navVal, UndrlygPric:"", SttlmPric: navVal,
            OpnIntrst:"", ChngInOpnIntrst:"",
            TtlTradgVol:"0", TtlTrfVal:"0", TtlNbOfTxsExctd:"0",
            SsnId:"F1", NewBrdLotQty:"1", Rmks:"", Rsvd1:"", Rsvd2:"", Rsvd3:"", Rsvd4:""
          });
        }
      }
    } else if(!line.includes(";") && !/^\d/.test(line)) {
      currentAMC = line;
    }
  }
  return rows;
}
