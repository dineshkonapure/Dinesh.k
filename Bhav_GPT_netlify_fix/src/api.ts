export async function api<T=any>(path: string, init?: RequestInit): Promise<T>{
  const res = await fetch(`/api/${path}`, { ...init, headers: { ...(init?.headers||{}), "Accept":"application/json" } });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type")||"";
  return ct.includes("application/json") ? await res.json() : await res.text() as any;
}
