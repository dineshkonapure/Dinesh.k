
import { stringify } from "csv-stringify/sync";
export function toCsv(rows, header){
  const safeRows = rows.map(r=>{
    const x = {}; header.forEach(h=>{
      const v = r[h] ?? "";
      x[h] = (typeof v === "string" && /^[=+\-@]/.test(v)) ? ("'"+v) : v;
    });
    return x;
  });
  return stringify(safeRows, { header:true, columns: header, record_delimiter: "\r\n" });
}
