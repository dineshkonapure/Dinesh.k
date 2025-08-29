
const $ = (s) => document.querySelector(s);
const toast = (m) => { const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); setTimeout(()=>t.classList.add("hidden"), 2200); };
const log = (m) => { const el=$("#statusLog"); el.textContent += (el.textContent? "\n":"") + m; el.scrollTop = el.scrollHeight; };

const HEADER = ["TradDt","BizDt","Sgmt","Src","FinInstrmTp","FinInstrmId","ISIN","TckrSymb","SctySrs","XpryDt","FininstrmActlXpryDt","StrkPric","OptnTp","FinInstrmNm","OpnPric","HghPric","LwPric","ClsPric","LastPric","PrvsClsgPric","UndrlygPric","SttlmPric","OpnIntrst","ChngInOpnIntrst","TtlTradgVol","TtlTrfVal","TtlNbOfTxsExctd","SsnId","NewBrdLotQty","Rmks","Rsvd1","Rsvd2","Rsvd3","Rsvd4"];

let rows = [];
let page = 0;
const PAGE_SIZE = 10;

flatpickr("#datePick", { mode:"single", dateFormat:"Y-m-d" });

$("#btnLoadIsin").addEventListener("click", async ()=>{
  try{
    const r = await fetch("/.netlify/functions/get-isin-list");
    const js = await r.json();
    $("#isinInput").value = (js.isins || []).join("\n");
    toast("Loaded saved ISIN list.");
  }catch(e){ toast("Load failed"); }
});

$("#btnSaveIsin").addEventListener("click", async ()=>{
  const raw = $("#isinInput").value;
  const r = await fetch("/.netlify/functions/save-isin-list", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ isins: raw })
  });
  const js = await r.json().catch(()=>({}));
  $("#msg").textContent = js.message || "Saved.";
  toast("ISIN list saved.");
});

$("#btnOpen").addEventListener("click", async ()=>{
  const date = $("#datePick").value;
  if(!date){ toast("Pick a date"); return; }
  const q = encodeURIComponent(date);
  window.open(`/.netlify/functions/open-files?date=${q}&src=nse`, "_blank");
  window.open(`/.netlify/functions/open-files?date=${q}&src=bse`, "_blank");
  window.open(`/.netlify/functions/open-files?date=${q}&src=pr`, "_blank");
  window.open(`/.netlify/functions/open-files?date=${q}&src=amfi`, "_blank");
});

$("#btnDownloadAll").addEventListener("click", async ()=>{
  const date = $("#datePick").value;
  if(!date){ toast("Pick a date"); return; }
  rows = []; renderTable(); page = 0; $("#downloads").innerHTML="";
  const isins = $("#isinInput").value || "";
  const persist = $("#persistToggle").checked;
  setBusy("#btnDownloadAll", true, "Fetching…");
  try{
    const r = await fetch("/.netlify/functions/run-one", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ date, isins, store: !!persist })
    });
    const js = await r.json();
    if(!js.ok){ throw new Error(js.message || "run-one failed"); }
    log(js.log?.join("\n") || "Done.");
    rows = js.rows || [];
    renderTable();
    if(js.csvB64){
      const name = js.fileName || `BhavCopy_ALL_MKT_CM_0_0_0_${date.replaceAll('-','')}_F_0000.csv`;
      const link = document.createElement("a");
      link.href = "data:text/csv;base64," + js.csvB64;
      link.download = name;
      link.click();
    }
    const d = $("#downloads"); d.innerHTML = "";
    (js.files || []).forEach(f=>{
      const a = document.createElement("a");
      a.href = f.url; a.textContent = f.name; a.className="badge"; a.target="_blank"; d.appendChild(a);
    });
    toast("ALL_MKT ready");
  }catch(e){
    log("ALL_MKT error: " + e.message);
    toast("ALL_MKT failed");
  }finally{
    setBusy("#btnDownloadAll", false);
  }
});

$("#btnDownloadAmfi").addEventListener("click", async ()=>{
  const date = $("#datePick").value;
  if(!date){ toast("Pick a date"); return; }
  rows = []; renderTable(); page = 0; $("#downloads").innerHTML="";
  const isins = $("#isinInput").value || "";
  setBusy("#btnDownloadAmfi", true, "Fetching…");
  try{
    const r = await fetch("/.netlify/functions/amfi-only", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ date, isins })
    });
    const js = await r.json();
    if(!js.ok){ throw new Error(js.message || "amfi-only failed"); }
    log(js.log?.join("\n") || "Done.");
    rows = js.rows || [];
    renderTable();
    if(js.csvB64){
      const name = js.fileName || `AMFI_${date}.csv`;
      const link = document.createElement("a");
      link.href = "data:text/csv;base64," + js.csvB64;
      link.download = name;
      link.click();
    }
    toast("AMFI ready");
  }catch(e){
    log("AMFI error: " + e.message);
    toast("AMFI failed");
  }finally{
    setBusy("#btnDownloadAmfi", false);
  }
});

$("#btnCopyTable").addEventListener("click", async ()=>{
  if(!rows.length){ toast("No rows"); return; }
  const cur = getFilteredPaged();
  const tsv = [HEADER.join("\t")]
    .concat(cur.map(r=>HEADER.map(h=> (r[h] ?? "")).join("\t")))
    .join("\n");
  await navigator.clipboard.writeText(tsv);
  toast(`Copied ${cur.length} rows`);
});

$("#prevPage").addEventListener("click", ()=>{ if(page>0){page--; renderTable();}});
$("#nextPage").addEventListener("click", ()=>{ const tot = getFiltered().length; if((page+1)*PAGE_SIZE<tot){page++; renderTable();}});
$("#search").addEventListener("input", ()=>{ page=0; renderTable(); });

function getFiltered(){
  const q = $("#search").value?.toLowerCase() || "";
  return rows.filter(r=> !q || (`${r.ISIN} ${r.TckrSymb} ${r.FinInstrmNm} ${r.Src}`.toLowerCase().includes(q)));
}
function getFilteredPaged(){
  const arr = getFiltered();
  const start = page*PAGE_SIZE;
  return arr.slice(start, start+PAGE_SIZE);
}

function renderTable(){
  const wrap = $("#tableWrap");
  const data = getFilteredPaged();
  const all = getFiltered();
  $("#pageInfo").textContent = `${Math.min(all.length, page*PAGE_SIZE+1)}–${Math.min(all.length, (page+1)*PAGE_SIZE)} / ${all.length}`.replace(/^1–0/,"0–0");
  if(data.length===0){ wrap.innerHTML = "<div class='hint'>No rows</div>"; return; }
  const rowsNorm = data.map(r=>{ const o={}; HEADER.forEach(h=> o[h] = r[h] ?? ""); return o; });
  let html = "<table><thead><tr>" + HEADER.map(c=>`<th>${c}</th>`).join("") + "</tr></thead><tbody>";
  html += rowsNorm.map(r=>"<tr>"+HEADER.map(c=>`<td>${escapeHtml(r[c])}</td>`).join("")+"</tr>").join("");
  html += "</tbody></table>";
  wrap.innerHTML = html;
}

function setBusy(sel, on, text){
  const b = $(sel); b.disabled = !!on;
  b.dataset._t = b.textContent;
  if(on && text) b.textContent = text; else if(!on && b.dataset._t) b.textContent = b.dataset._t;
}
function escapeHtml(s){ return String(s).replace(/[&<>]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])); }
