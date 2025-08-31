import { useEffect, useState } from "react";
import { getTheme, setTheme } from "../lib/theme";
export default function ThemeToggle(){
  const [t,setT] = useState<"dark"|"light">("dark");
  useEffect(()=>{ const v = getTheme(); setT(v); setTheme(v); },[]);
  return <button className="btn" onClick={()=>{ const n=t==="dark"?"light":"dark"; setT(n); setTheme(n); }}>{t==="dark"?"🌙 Dark":"☀️ Light"}</button>;
}
