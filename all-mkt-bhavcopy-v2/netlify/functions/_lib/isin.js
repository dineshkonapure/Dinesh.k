
export function normalizeIsinList(raw){
  const tokens = (raw||"").split(/[\s,;]+/g).map(t=>t.trim().toUpperCase()).filter(Boolean);
  const valid = new Set(); const invalid=[];
  for(const t of tokens){ if(isValidISIN(t)) valid.add(t); else invalid.push(t); }
  return { valid:Array.from(valid), invalid };
}
export function isValidISIN(isin){
  if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  const digits = isin.replace(/[A-Z]/g, ch => (ch.charCodeAt(0)-55).toString());
  let sum=0, alt=false;
  for(let i=digits.length-1;i>=0;i--){
    let n = parseInt(digits[i],10);
    if(alt){ n*=2; if(n>9) n = Math.floor(n/10) + (n%10); }
    sum += n; alt = !alt;
  }
  return (sum % 10) === 0;
}
