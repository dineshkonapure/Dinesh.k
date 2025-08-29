// Bhav_GPT/netlify/functions/convert_upload.ts
import { type Context } from "@netlify/functions";
import JSZip from "jszip";
import { corsHeaders } from "./_shared";
import {
  parseCsv,
  toCsv,
  ALL_MKT_HEADER,
  amfiToAllMktRows,
  mergeByISIN,
} from "./lib-server.ts";

/**
 * Accepts multipart/form-data with optional fields:
 *   - amfi  : AMFI daily TXT/CSV
 *   - nse   : NSE bhavcopy CSV *or* ZIP containing CSV
 *   - bse   : BSE bhavcopy CSV
 *   - przip : NSE PR ZIP (will extract PR*.CSV)
 *
 * Returns: application/zip containing (if available)
 *   - BhavCopy_AMFI_CM_0_0_0_UPLOAD_F_0000.csv       (AMFI → All-Market)
 *   - BhavCopy_ALL_MKT_CM_0_0_0_UPLOAD_F_0000.csv    (NSE + BSE + AMFI merged by ISIN)
 *   - PR_UPLOAD.csv                                   (extracted from PR.zip)
 *   - manifest.json                                   (what was received/produced)
 */
export default async (req: Request, _ctx: Context) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders(),
    });
  }

  // ---- Parse multipart form ----
  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return json({ ok: false, error: "Invalid multipart form" }, 400);
  }

  const getFile = (name: string) => {
    const v = form.get(name);
    return v instanceof File ? v : null;
  };

  const fAmfi = getFile("amfi");
  const fNse = getFile("nse");
  const fBse = getFile("bse");
  const fPrZip = getFile("przip");

  if (!fAmfi && !fNse && !fBse && !fPrZip) {
    return json(
      {
        ok: false,
        error:
          "No files received. Expected one or more of: amfi, nse, bse, przip",
      },
      400
    );
  }

  // ---- Read & normalize inputs ----
  const manifest: Record<string, unknown> = {
    received: {
      amfi: fileMeta(fAmfi),
      nse: fileMeta(fNse),
      bse: fileMeta(fBse),
      przip: fileMeta(fPrZip),
    },
    produced: {},
  };

  // AMFI → rows shaped as ALL_MKT
  let amfiRows: string[][] = [];
  if (fAmfi) {
    const txt = await fileText(fAmfi);
    const { header: h, rows } = parseCsv(txt);
    const mapped = amfiToAllMktRows(rows, h); // includes header at [0]
    amfiRows = mapped.slice(1); // exclude header
  }

  // NSE rows
  let nseHeader: string[] = [];
  let nseRows: string[][] = [];
  if (fNse) {
    if (isZipFile(fNse)) {
      const { header, rows } = await csvFromZip(fNse);
      nseHeader = header;
      nseRows = rows;
    } else {
      const txt = await fileText(fNse);
      const { header, rows } = parseCsv(txt);
      nseHeader = header;
      nseRows = rows;
    }
  }

  // BSE rows
  let bseHeader: string[] = [];
  let bseRows: string[][] = [];
  if (fBse) {
    const txt = await fileText(fBse);
    const { header, rows } = parseCsv(txt);
    bseHeader = header;
    bseRows = rows;
  }

  // PR extraction
  let prExtractedCsv: string | undefined;
  if (fPrZip) {
    prExtractedCsv = await extractPrCsv(fPrZip); // may be undefined if not found
  }

  // ---- Build outputs ----
  const zip = new JSZip();

  // 1) AMFI → All-Market CSV (if AMFI provided)
  if (fAmfi) {
    const amfiAllMkt = toCsv(ALL_MKT_HEADER, amfiRows);
    zip.file(
      "BhavCopy_AMFI_CM_0_0_0_UPLOAD_F_0000.csv",
      amfiAllMkt,
      zipTextOpts()
    );
    manifest.produced = {
      ...(manifest.produced as object),
      amfi_as_all_mkt: true,
    };
  }

  // 2) ALL_MKT merged (NSE rows + BSE uniques + AMFI uniques by ISIN)
  // choose an ALL_MKT-like header: prefer NSE's, else BSE's, else canonical
  if (nseRows.length || bseRows.length || amfiRows.length) {
    const header =
      nseHeader.length > 0
        ? nseHeader
        : bseHeader.length > 0
        ? bseHeader
        : ALL_MKT_HEADER;
    const merged = mergeByISIN(header, nseRows, bseRows, amfiRows);
    const outCsv = toCsv(header, merged);
    zip.file(
      "BhavCopy_ALL_MKT_CM_0_0_0_UPLOAD_F_0000.csv",
      outCsv,
      zipTextOpts()
    );
    manifest.produced = {
      ...(manifest.produced as object),
      all_mkt: true,
    };
  }

  // 3) PR extracted CSV (if PR.zip provided and CSV found)
  if (prExtractedCsv) {
    zip.file("PR_UPLOAD.csv", prExtractedCsv, zipTextOpts());
    manifest.produced = {
      ...(manifest.produced as object),
      pr_extracted: true,
    };
  }

  // 4) manifest
  zip.file("manifest.json", JSON.stringify(manifest, null, 2), zipTextOpts());

  // If nothing was produced (e.g., only bad files), error out
  if (Object.keys(manifest.produced as object).length === 0) {
    return json(
      {
        ok: false,
        error:
          "No outputs produced. Ensure files are valid AMFI/NSE/BSE CSVs or NSE PR ZIP.",
        manifest,
      },
      422
    );
  }

  const out = await zip.generateAsync({ type: "uint8array" });
  return new Response(out, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=BhavCopy_manual_convert.zip`,
      ...corsHeaders(),
    },
  });
};

// ---------- helpers ----------

function fileMeta(f: File | null) {
  if (!f) return null;
  return { name: f.name, type: f.type, size: f.size };
}

async function fileText(f: File) {
  return await f.text();
}

function isZipFile(f: File) {
  const name = (f.name || "").toLowerCase();
  return name.endsWith(".zip") || (f.type || "").includes("zip");
}

async function csvFromZip(f: File) {
  const buf = new Uint8Array(await f.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const file =
    Object.values(zip.files).find(
      (x) => !x.dir && /\.csv$/i.test(x.name || "")
    ) || null;
  if (!file) return { header: [] as string[], rows: [] as string[][] };
  const txt = await file.async("string");
  return parseCsv(txt);
}

async function extractPrCsv(f: File) {
  const buf = new Uint8Array(await f.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const file =
    Object.values(zip.files).find(
      (x) => !x.dir && /^PR.*\.CSV$/i.test(x.name || "")
    ) ||
    Object.values(zip.files).find(
      (x) => !x.dir && /\.csv$/i.test(x.name || "")
    ) ||
    null;
  if (!file) return undefined;
  return await file.async("string");
}

function zipTextOpts() {
  return { binary: false, compression: "DEFLATE" as const };
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
