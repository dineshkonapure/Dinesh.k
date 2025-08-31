type Props = { processedDate?:string; rows?:number; files?:string[]; manifestUrl?:string; };
export default function SummaryCard(p:Props){
  return (<div className="card p-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <strong>Summary</strong>
      {p.manifestUrl && <a className="btn" href={p.manifestUrl} target="_blank" rel="noreferrer">Manifest</a>}
    </div>
    <div className="mt-2 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
      <div><span className="tag">Date</span> <span className="ml-2">{p.processedDate||"—"}</span></div>
      <div><span className="tag">Rows</span> <span className="ml-2">{p.rows??0}</span></div>
      <div className="col-span-2"><span className="tag">Files</span> <span className="ml-2">{p.files?.join(", ")||"—"}</span></div>
    </div>
  </div>);
}
