// Bhav_GPT/src/lib/csv.ts
/* Lightweight CSV helpers used by preview/Copy(TAB).
   - parseCsv: RFC4180-ish (handles quotes + CRLF)
   - toCsv: escapes quotes, commas, CR/LF
*/

export function parseCsv(txt: string) {
  const out: string[][] = [];
  let row: string[] = [];
  let f = "";
  let i = 0;
  let q = false;

  while (i < txt.length) {
    const c = txt[i++];
    if (q) {
      if (c === '"') {
        if (txt[i] === '"') {
          f += '"';
          i++;
        } else {
          q = false;
        }
      } else {
        f += c;
      }
    } else {
      if (c === '"') {
        q = true;
      } else if (c === ",") {
        row.push(f);
        f = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && txt[i] === "\n") i++; // swallow CRLF
        if (row.length || f.length) {
          row.push(f);
          out.push(row);
        }
        row = [];
        f = "";
      } else {
        f += c;
      }
    }
  }
  if (f.length || row.length) {
    row.push(f);
    out.push(row);
  }
  if (!out.length) return { header: [] as string[], rows: [] as string[][] };
  const header = out.shift() || [];
  return { header, rows: out };
}

export function toCsv(header: string[], rows: string[][]) {
  const esc = (s: unknown) =>
    /[",\n\r]/.test(String(s ?? ""))
      ? `"${String(s ?? "").replace(/"/g, '""')}"`
      : String(s ?? "");
  const lines = [header.map(esc).join(",")];
  for (const r of rows) lines.push(r.map(esc).join(","));
  return lines.join("\r\n");
}
