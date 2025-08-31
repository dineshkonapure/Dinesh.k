export type Theme = "dark"|"light";
export function getTheme():Theme{
  const s = localStorage.getItem("theme");
  return (s==="light"||s==="dark") ? s : "dark";
}
export function setTheme(t:Theme){
  localStorage.setItem("theme", t);
  document.documentElement.classList.toggle("light", t==="light");
}
