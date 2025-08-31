type DiffStats = {
  currentDate: string; previousDate: string;
  rowsCurrent: number; rowsPrev: number;
  uniqueIsinCurrent: number; uniqueIsinPrev: number;
  nullCountsCurrent: Record<string,number>; nullCountsPrev: Record<string,number>;
};
export default function DiffCard({stats}:{stats?:DiffStats}){
  return (<div className="card p-4">
    <strong>Diff</strong>
    {!stats ? <div className="text-sm mt-2 text-[var(--muted)]">No diff yet.</div> :
      <div className="mt-2 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="card p-3 bg-[var(--panel-2)]"><div><b>{stats.currentDate}</b></div><div>Rows: {stats.rowsCurrent}</div><div>Unique ISINs: {stats.uniqueIsinCurrent}</div></div>
        <div className="card p-3 bg-[var(--panel-2)]"><div><b>{stats.previousDate}</b></div><div>Rows: {stats.rowsPrev}</div><div>Unique ISINs: {stats.uniqueIsinPrev}</div></div>
      </div>}
  </div>);
}
