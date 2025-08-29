import { type Context } from "@netlify/functions";
import { store } from "./_shared.ts";

export default async (_req: Request, _ctx: Context) => {
  const list = await store.list({ prefix: "" });
  return new Response(JSON.stringify(list.objects ?? []), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }});
};
