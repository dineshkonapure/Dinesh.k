// Bhav_GPT/src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { nowInIST, toYMD, latestTradingDay, isWeekend } from "./lib/dates";
import { fetchOriginal, convert, openAll } from "./lib/api";
import { parseCsv } from "./lib/csv";

type Mode = "tabs" | "zip";
type TypeT = "original" | "processed";

export default function App() {
  const istNow = useMemo(() => nowInIST(), []);
  const [date, setDate] = useState(() => toYMD(latestTradingDay(istNow)));
  const [mode, setMode] = useState<Mode>("zip");
  const [type, setType] = useState<TypeT>("original");
  const [log, setLog] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [header, setHeader] = useState<string[]>([]);

  const addLog = (s: string) => setLog((x) => [s, ...x].slice(0, 200));

  async function doFetchAll() {
    addLog("Fetching originals for " + date);
    for (const src of ["amfi", "nse", "bse", "pr"] as const) {
      const r = await fetchOriginal(date, src);
      addLog(`${src.toUpperCase()}: ${r.status}`);
    }
  }

  async function doConvertAll() {
    addLog("Converting AMFI-as-All-Mkt...");
    await convert(date, "amfi");
    addLog("Converting ALL_MKT merged...");
    await convert(date, "all_mkt");
    addLog("Extracting PR.zip...");
    await convert(date, "pr_extracted");
    addLog("Done conversions.");
  }

  async function doOpenAll() {
    const r = await openAll(date, type, mode);
    if (mode === "tabs") {
      const { links } = await r.json();
      (links as string[]).forEach((href) => window.open(href, "_blank"));
      addLog(`Opened ${links.length} tab links.`);
    } else {
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `BhavCopy_${type}_${date}.zip`;
      a.click();
      addLog("Downloaded zip for " + type);
    }
  }

  async function loadPreview() {
    addLog("Loading preview ALL_MKT...");
    const r = await convert(date, "all_mkt");
    const txt = await r.text();
    const { header: h, rows } = parseCsv(txt);
    setHeader(h);
    setPreview(rows.slice(0, 250));
    addLog("Preview loaded.");
  }

  function pickLatestTrading() {
    const d = latestTradingDay(nowInIST());
    setDate(toYMD(d));
  }

  const disabledWeekend = useMemo(() => {
    const d = new Date(date + "T00:00:00");
    return isWeekend(d);
  }, [date]);

  return (
    <div>
      <section className="card">
        <div className="row">
          <div>
            <label className="muted">Trading Date&nbsp;</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button onClick={pickLatestTrading} title="Pick latest trading day">
            Latest Trading Day
          </button>
          {disabledWeekend && <span className="pill">Weekend selected</span>}
          <span className="muted">
            IST now:{" "}
            {istNow.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </span>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Downloads</h3>
          <div className="row">
            <button className="primary" onClick={doFetchAll}>
              Fetch Originals (AMFI/NSE/BSE/PR)
            </button>
            <button onClick={doConvertAll}>
              Convert (AMFI-as-All-Mkt / ALL_MKT / PR extract)
            </button>
          </div>
          <p className="muted">
            Runs via serverless with caching; filenames kept compatible.
          </p>
        </div>

        <div className="card">
          <h3>Open All</h3>
          <div className="row" style={{ gap: 8 }}>
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeT)}
            >
              <option value="original">Originals</option>
              <option value="processed">Processed</option>
            </select>
            <label>Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="zip">Zip</option>
              <option value="tabs">Tabs</option>
            </select>
            <button className="primary" onClick={doOpenAll}>
              Open
            </button>
          </div>
          <p className="muted">
            Zip avoids popup blockers; Tabs mirrors your “Open All Links”.
          </p>
        </div>

        <div className="card">
          <h3>Preview &amp; Copy</h3>
          <div className="row">
            <button onClick={loadPreview}>Load Preview (ALL_MKT)</button>
            <button
              onClick={async () => {
                const r = await convert(date, "all_mkt");
                const txt = await r.text();
                await navigator.clipboard.writeText(txt.replace(/,/g, "\t"));
                addLog("Copied table as TAB-separated.");
              }}
            >
              Copy (TAB)
            </button>
            <button
              onClick={async () => {
                const r = await convert(date, "all_mkt");
                const blob = await r.blob();
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `BhavCopy_ALL_MKT_CM_0_0_0_${date.replace(
                  /-/g,
                  ""
                )}_F_0000.csv`;
                a.click();
              }}
            >
              Download CSV
            </button>
          </div>
          <div style={{ maxHeight: 360, overflow: "auto", marginTop: 8 }}>
            <table>
              <thead>
                <tr>
                  {header.map((h, i) => (
                    <th key={i} className="mono">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} className="mono">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>ISINs</h3>
          <IsinDrawer />
        </div>
      </section>

      <section className="card">
        <h3>Logs</h3>
        <div className="mono" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
          {log.join("\n")}
        </div>
      </section>
    </div>
  );
}

function IsinDrawer() {
  const [text, setText] = useState(localStorage.getItem("my_isins") || "");
  const isins = useMemo(
    () =>
      Array.from(
        new Set(
          text
            .split(/[^A-Z0-9]+/i)
            .map((x) => x.trim().toUpperCase())
            .filter(Boolean)
        )
      ),
    [text]
  );

  useEffect(() => {
    localStorage.setItem("my_isins", text);
  }, [text]);

  return (
    <div>
      <p className="muted">
        Paste ISINs (separated by comma/space/newline). Stored locally.
      </p>
      <textarea
        rows={5}
        style={{ width: "100%" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="chips" style={{ marginTop: 8 }}>
        {isins.map((x) => (
          <span className="chip" key={x}>
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}
