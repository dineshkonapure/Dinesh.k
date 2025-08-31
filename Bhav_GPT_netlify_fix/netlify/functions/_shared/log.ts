export function log(...args: any[]){
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, msg: args.map(a=> (typeof a === "string" ? a : JSON.stringify(a))).join(" ") }));
}
