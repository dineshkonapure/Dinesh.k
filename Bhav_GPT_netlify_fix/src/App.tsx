import { useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import SummaryCard from "./components/SummaryCard";
import DiffCard from "./components/DiffCard";
import { api } from "./api";

function iso(d: Date){ const z=(n:number)=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; }

export default function App(){
  const [date, setDate] = useState<string>(iso(new Date()));
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{date?:string, rows?:number, files?:string[], manifestUrl?:string}>();
  const [diff, setDiff] = useState<any>(null);

  async function processAndDiff(){
    setBusy(true);
    try{
      await api(`fetch-source?date=${date}`);
      const conv = await api(`convert?date=${date}`);
      setSummary({ date, rows: conv?.allRows ?? 0, files: conv?.files ?? [], manifestUrl: conv?.manifestUrl });
      const d = await api(`diff?date=${date}`); setDiff(d);
    } finally { setBusy(false); }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-3">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-extrabold">Bhav_GPT</h1>
        <ThemeToggle />
      </header>
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="tag">Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <button className="btn btn-primary" onClick={processAndDiff} disabled={busy}>{busy?"Processing…":"Process & Diff"}</button>
          <a className="btn" href={`/api/open-all?date=${date}`} target="_blank" rel="noreferrer">Download ZIP</a>
        </div>
      </div>
      <SummaryCard processedDate={summary?.date} rows={summary?.rows} files={summary?.files} manifestUrl={summary?.manifestUrl} />
      <DiffCard stats={diff} />
    </div>
  );
}
