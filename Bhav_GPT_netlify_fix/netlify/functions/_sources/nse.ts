import { parseCsv } from "../lib-server/csv.ts";
export function parseNseCsv(csvText: string){ const { header, rows } = parseCsv(csvText); return { header, rows }; }
