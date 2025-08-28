import { stringify } from "csv-stringify/sync";

export function toCsv(rows, header){
  const safeRows = rows.map(r=>{
    const x = {...r};
    for(const k in x){
      if(typeof x[k] === "string" && /^[=+\-@]/.test(x[k])) x[k] = "'"+x[k];
    }
    return x;
  });
  return stringify(safeRows, { header:true, columns: header, record_delimiter: "\r\n" });
}
