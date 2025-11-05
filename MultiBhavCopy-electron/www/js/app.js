const pad = n => (n < 10 ? '0' : '') + n;
const ymd = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
const dmy2 = d => pad(d.getDate()) + pad(d.getMonth() + 1) + String(d.getFullYear()).slice(2);
const yyyy_mm_dd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtHuman = d => new Intl.DateTimeFormat('en-IN',{weekday:'short',year:'numeric',month:'short',day:'2-digit'}).format(d);
const inIST = (date = new Date()) => new Date(new Date(date).toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));

const HOLIDAYS = {
  2025: new Set([
    '2025-02-26','2025-03-14','2025-03-31','2025-04-10','2025-04-14','2025-04-18',
    '2025-05-01','2025-08-15','2025-08-27','2025-10-02','2025-10-21','2025-10-22',
    '2025-11-05','2025-12-25'
  ]),
  2026: new Set([])
};
const HOLIDAY_NAMES = {
  '2025-10-21':'Diwali (Laxmi Pujan)',
  '2025-10-22':'Diwali-Balipratipada',
  '2025-04-10':'Mahavir Jayanti',
  '2025-04-18':'Good Friday',
  '2025-12-25':'Christmas'
};

const isHoliday = d => { const s=yyyy_mm_dd(d); const set=HOLIDAYS[d.getFullYear()]; return !!(set && set.has(s)); };
const holidayName = d => HOLIDAY_NAMES[yyyy_mm_dd(d)] || '';
const isWeekend = d => d.getDay()===0 || d.getDay()===6;
const isFuture = d => { const t=inIST(); const today=new Date(t.getFullYear(),t.getMonth(),t.getDate()); return d>today; };
const isMarketDay = d => !isWeekend(d) && !isHoliday(d);
const isMarketDayNoFuture = d => isMarketDay(d) && !isFuture(d);
const nextMktDay = d => { const x=new Date(d); do{x.setDate(x.getDate()+1);}while(!isMarketDay(x)); return x; };
const prevMktDay = d => { const x=new Date(d); do{x.setDate(x.getDate()-1);}while(!isMarketDay(x)); return x; };

const buildUrls = d => [
  `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${ymd(d)}_F_0000.csv.zip`,
  `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${ymd(d)}_F_0000.csv`,
  `https://archives.nseindia.com/archives/equities/bhavcopy/pr/PR${dmy2(d)}.zip`
];

let viewYear, viewMonth;
let rangeStart=null, rangeEnd=null;
let focusDate=null;

const calTitle=document.getElementById('calTitle');
const calGrid=document.getElementById('calGrid');
const selDateEl=document.getElementById('selDate');
const quickChip=document.getElementById('quickChip');
const infoLine=document.getElementById('infoLine');
const progressEl=document.getElementById('progress');

const sameDay=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const inRange=(d,s,e)=>{ if(!s||!e) return false; const a=s<e?s:e; const b=s<e?e:s; const t=d.getTime(); return t>a.getTime()&&t<b.getTime(); };

function monthCells(y,m){
  const first=new Date(y,m,1);
  const startDow=first.getDay();
  const start=new Date(y,m,1-startDow);
  const arr=[];
  for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); arr.push(d); }
  return arr;
}

function statusText(d){
  const date=fmtHuman(d);
  if(isHoliday(d)){
    const name=holidayName(d);
    return `${date} — (Market holiday)${name?' '+name:''}`;
  }
  if(isWeekend(d)) return `${date} — (Weekend)`;
  if(isFuture(d)) return `${date} — (Future date)`;
  return `${date} — (Market day)`;
}

function renderCalendar(){
  calGrid.innerHTML='';
  const now=inIST();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const cells=monthCells(viewYear,viewMonth);
  const monthStart=new Date(viewYear,viewMonth,1);
  const frag=document.createDocumentFragment();
  cells.forEach(cd=>{
    const el=document.createElement('div');
    el.className='day';
    el.textContent=String(cd.getDate());
    el.dataset.date=cd.toISOString();
    if(cd.getMonth()!==viewMonth) el.classList.add('other');
    if(sameDay(cd,today)) el.classList.add('today');
    if(isWeekend(cd)){ const dot=document.createElement('span'); dot.className='dot wkd'; el.appendChild(dot); }
    if(isHoliday(cd)){ const dot=document.createElement('span'); dot.className='dot hld'; el.appendChild(dot); }
    const disabled=!isMarketDayNoFuture(cd);
    if(disabled){ el.classList.add('disabled'); el.tabIndex=-1; }
    else { el.tabIndex=-1; el.addEventListener('click',()=>selectDate(cd)); }
    el.addEventListener('mouseenter',()=>infoLine.textContent=statusText(cd));
    el.addEventListener('mouseleave',()=>infoLine.textContent='');
    el.addEventListener('focus',()=>infoLine.textContent=statusText(cd));
    el.addEventListener('blur',()=>infoLine.textContent='');
    if(rangeStart&&rangeEnd){
      if(sameDay(cd,rangeStart)) el.classList.add('selected-start');
      else if(sameDay(cd,rangeEnd)) el.classList.add('selected-end');
      else if(inRange(cd,rangeStart,rangeEnd)) el.classList.add('selected-middle');
    } else if(rangeStart&&sameDay(cd,rangeStart)) el.classList.add('selected-start');
    frag.appendChild(el);
  });
  calGrid.appendChild(frag);
  calTitle.textContent=monthStart.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  ensureFocus();
}

function selectDate(d){
  if(!isMarketDayNoFuture(d)) return;
  if(!rangeStart||(rangeStart&&rangeEnd)){ rangeStart=d; rangeEnd=null; }
  else rangeEnd=d;
  focusDate=d;
  updateSelectedText();
  renderCalendar();
}
function selectedDates(){
  if(!rangeStart||!rangeEnd) return rangeStart?[rangeStart]:[];
  const s=rangeStart<rangeEnd?rangeStart:rangeEnd;
  const e=rangeStart<rangeEnd?rangeEnd:rangeStart;
  const out=[]; const x=new Date(s);
  while(x<=e){ if(isMarketDayNoFuture(x)) out.push(new Date(x)); x.setDate(x.getDate()+1); }
  return out;
}
function updateSelectedText(){
  const days=selectedDates();
  if(!days.length){ selDateEl.textContent=rangeStart?`Selected ${fmtHuman(rangeStart)} (single day)`:'No date selected'; return; }
  selDateEl.textContent=days.length===1?`Selected ${fmtHuman(days[0])}`:`${days.length} days: ${fmtHuman(days[0])} → ${fmtHuman(days.at(-1))}`;
}

function ensureFrame(){ let f=document.getElementById('dlframe'); if(!f){ f=document.createElement('iframe'); f.id='dlframe'; f.style.cssText='width:0;height:0;border:0;position:absolute;left:-9999px;'; document.body.appendChild(f);} return f; }
function setProgress(r){ progressEl.style.width=Math.max(0,Math.min(100,r*100))+'%'; }
function downloadSequential(urls,delay=1700){
  if(!urls.length) return;
  ensureFrame();
  let i=0;
  setProgress(0);
  (function step(){
    if(i>=urls.length){
      setProgress(1);
      setTimeout(()=>setProgress(0),1200);
      return;
    }
    document.getElementById('dlframe').src = urls[i];
    setProgress(i/urls.length);
    i++;
    setTimeout(step, delay);
  })();
}

function downloadSelection(){
  const dates = selectedDates().length ? selectedDates() : (rangeStart ? [rangeStart] : []);
  if(!dates.length) return;
  const urls = dates.flatMap(buildUrls);
  const last = dates.reduce((a,b)=>a>b?a:b);
  localStorage.setItem('bhavcopyLastDate', last.toISOString());
  downloadSequential(urls);
}

/* Quick Select functionality */
function latestAvailableTradingDay(){
  const now=inIST();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const after530=(now.getHours()>17)||(now.getHours()===17 && now.getMinutes()>=30);
  return after530
    ? (isMarketDay(today)?today:prevMktDay(today))
    : prevMktDay(today);
}

function quickSelect(){
  const lastISO=localStorage.getItem('bhavcopyLastDate');
  if(!lastISO){
    quickChip.animate([{opacity:1},{opacity:.4},{opacity:1}],{duration:600,iterations:1});
    return;
  }
  const last=new Date(lastISO);
  const from=nextMktDay(last);
  const to=latestAvailableTradingDay();
  if(from>to){
    quickChip.animate([{opacity:1},{opacity:.4},{opacity:1}],{duration:600,iterations:1});
    return;
  }
  rangeStart=from;
  rangeEnd=to;
  focusDate=new Date(from);
  viewYear=from.getFullYear();
  viewMonth=from.getMonth();
  updateSelectedText();
  renderCalendar();
}

/* Keyboard shortcut Ctrl+Q */
document.addEventListener('keydown',(e)=>{
  const mac=/Mac|iPod|iPhone|iPad/.test(navigator.platform);
  if((mac && e.metaKey && e.key.toLowerCase()==='q') || (!mac && e.ctrlKey && e.key.toLowerCase()==='q')){
    e.preventDefault();
    quickSelect();
  }
});

/* Calendar keyboard navigation */
function moveFocus(delta){
  if(!focusDate) focusDate=new Date(viewYear,viewMonth,1);
  const t=new Date(focusDate);
  t.setDate(t.getDate()+delta);
  viewYear=t.getFullYear();
  viewMonth=t.getMonth();
  focusDate=t;
  renderCalendar();
}

function ensureFocus(){
  if(!focusDate) return;
  const nodes=[...calGrid.querySelectorAll('.day')];
  const n=nodes.find(el=>new Date(el.dataset.date).toDateString()===focusDate.toDateString());
  if(n){
    n.tabIndex=0;
    n.focus();
    infoLine.textContent=statusText(new Date(n.dataset.date));
  }
}

calGrid.addEventListener('keydown',e=>{
  switch(e.key){
    case'ArrowLeft': e.preventDefault(); moveFocus(-1); break;
    case'ArrowRight': e.preventDefault(); moveFocus(1); break;
    case'ArrowUp': e.preventDefault(); moveFocus(-7); break;
    case'ArrowDown': e.preventDefault(); moveFocus(7); break;
    case'Home': e.preventDefault(); focusDate=new Date(viewYear,viewMonth,1); renderCalendar(); break;
    case'End': e.preventDefault(); focusDate=new Date(viewYear,viewMonth+1,0); renderCalendar(); break;
    case'PageUp': e.preventDefault(); viewMonth--; if(viewMonth<0){viewMonth=11;viewYear--;} renderCalendar(); break;
    case'PageDown': e.preventDefault(); viewMonth++; if(viewMonth>11){viewMonth=0;viewYear++;} renderCalendar(); break;
    case' ': e.preventDefault(); if(focusDate) selectDate(new Date(focusDate)); break;
    case'Enter': e.preventDefault(); downloadSelection(); break;
  }
});

/* UI buttons */
document.getElementById('btnDownload').addEventListener('click', downloadSelection);
document.getElementById('clearDates').addEventListener('click', ()=>{
  rangeStart=null; rangeEnd=null;
  selDateEl.textContent='No date selected';
  infoLine.textContent='';
  renderCalendar();
});
document.getElementById('prevM').addEventListener('click', ()=>{
  viewMonth--; if(viewMonth<0){viewMonth=11;viewYear--;}
  renderCalendar();
});
document.getElementById('nextM').addEventListener('click', ()=>{
  viewMonth++; if(viewMonth>11){viewMonth=0;viewYear++;}
  renderCalendar();
});
document.getElementById('todayM').addEventListener('click', ()=>{
  const t=inIST();
  viewYear=t.getFullYear();
  viewMonth=t.getMonth();
  renderCalendar();
});
document.getElementById('quickChip').addEventListener('click', quickSelect);

/* Initialization with 5:30 PM IST logic */
(()=>{
  const now=inIST();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const after530=(now.getHours()>17)||(now.getHours()===17 && now.getMinutes()>=30);
  let initial;
  if(after530){
    initial=isMarketDay(today)?today:prevMktDay(today);
  } else {
    initial=isMarketDay(today)?prevMktDay(today):prevMktDay(today);
  }
  rangeStart=initial;
  rangeEnd=null;
  viewYear=initial.getFullYear();
  viewMonth=initial.getMonth();
  focusDate=new Date(initial);
  selDateEl.textContent='Selected ' + fmtHuman(initial) + ' (single day)';
  renderCalendar();
  calGrid.tabIndex=0;
  calGrid.focus();
})();
