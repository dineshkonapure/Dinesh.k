const $ = (s) => document.querySelector(s);
const toast = (m) => { const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); setTimeout(()=>t.classList.add("hidden"), 2600); };

let selectedDates = [];

flatpickr("#dateRange", {
  mode: "range",
  dateFormat: "Y-m-d",
  onChange: (dates) => { selectedDates = dates.map(d => d.toISOString().slice(0,10)); }
});

$("#loadIsin").addEventListener("click", async ()=>{
  const r = await fetch("/.netlify/functions/get-isin-list");
  const js = await r.json();
  $("#isinInput").value = (js.isins || []).join("\n");
  toast("Loaded saved ISIN list.");
});

$("#saveIsin").addEventListener("click", async ()=>{
  const raw = $("#isinInput").value;
  const res = await fetch("/.netlify/functions/save-isin-list", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ isins: raw })
  });
  const js = await res.json();
  $("#isinValidation").textContent = js.message || "Saved.";
  toast("ISIN list saved.");
});

$("#openFiles").addEventListener("click", async ()=>{
  const date = selectedDates[0];
  if(!date){ toast("Select at least one date"); return; }
  const q = encodeURIComponent(date);
  window.open(`/.netlify/functions/open-files?date=${q}&src=nse`, "_blank");
  window.open(`/.netlify/functions/open-files?date=${q}&src=bse`, "_blank");
  window.open(`/.netlify/functions/open-files?date=${q}&src=pr`, "_blank");
  window.open(`/.netlify/functions/open-files?date=${q}&src=amfi`, "_blank");
});

$("#runBtn").addEventListener("click", async ()=>{
  if(selectedDates.length===0){ toast("Select date range"); return; }
  const raw = $("#isinInput").value;
  const res = await fetch("/.netlify/functions/run", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ dates: selectedDates, isins: raw })
  });
  const js = await res.json();
  renderResult(js);
});

$("#search").addEventListener("input", ()=>renderTable(window.__preview || []));
$("#srcFilter").addEventListener("change", ()=>renderTable(window.__preview || []));

function renderResult(js){
  $("#statusLog").textContent = js.log || "";
  if(js.previewRows){ window.__preview = js.previewRows; renderTable(js.previewRows); }
  const d = $("#downloads"); d.innerHTML = "";
  (js.files || []).forEach(f=>{
    const a = document.createElement("a");
    a.href = f.url; a.textContent = f.name; a.className="badge"; a.target="_blank"; d.appendChild(a);

    const c = document.createElement("button");
    c.className="btn"; c.textContent="Copy link";
    c.onclick = async ()=>{ await navigator.clipboard.writeText(f.url); toast("Copied link"); };
    d.appendChild(c);
  });
  toast(js.message || "Done");
}

function renderTable(rows){
  const wrap = $("#tableWrap");
  const q = $("#search").value?.toLowerCase() || "";
  const src = $("#srcFilter").value || "";
  let filtered = rows.filter(r=>{
    const hay = `${r.ISIN} ${r.TckrSymb} ${r.FinInstrmNm} ${r.Src}`.toLowerCase();
    return (!q || hay.includes(q)) && (!src || r.Src === src);
  });
  const top = filtered.slice(0,10);
  if(top.length===0){ wrap.innerHTML = "<div class='hint'>No preview rows.</div>"; return; }
  const cols = Object.keys(top[0]);
  let html = "<table><thead><tr>" + cols.map(c=>`<th>${c}</th>`).join("") + "</tr></thead><tbody>";
  html += top.map(r=>"<tr>"+cols.map(c=>`<td>${r[c]??""}</td>`).join("")+"</tr>").join("");
  html += "</tbody></table>";
  wrap.innerHTML = html;
}
