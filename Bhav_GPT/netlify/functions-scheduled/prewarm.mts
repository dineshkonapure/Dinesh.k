import type { Config } from "@netlify/functions";
import { urls } from "../functions/_shared.ts";

// Called on schedule via netlify.toml; Netlify posts a JSON with { next_run: ... }
export default async (req: Request) => {
  const now = new Date(); // UTC
  const ist = new Date(now.getTime() + (5.5*60*60*1000));
  // pick latest trading day similar to your HTML logic (weekends/holidays omitted for brevity; frontend guards)
  let d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  if (ist.getUTCHours() < 11 || (ist.getUTCHours() === 11 && ist.getUTCMinutes() < 45)) d.setUTCDate(d.getUTCDate() - 1);
  // Kick off fetches (best-effort)
  const u = urls(d);
  await Promise.allSettled([ fetch(`/api/fetch?date=${iso(d)}&source=amfi`), fetch(`/api/fetch?date=${iso(d)}&source=nse`), fetch(`/api/fetch?date=${iso(d)}&source=bse`), fetch(`/api/fetch?date=${iso(d)}&source=pr`) ]);
  await Promise.allSettled([ fetch(`/api/convert?date=${iso(d)}&target=amfi`), fetch(`/api/convert?date=${iso(d)}&target=all_mkt`), fetch(`/api/convert?date=${iso(d)}&target=pr_extracted`) ]);
  return new Response("ok");
};
const iso = (d: Date) => d.toISOString().slice(0,10);

export const config: Config = { schedule: "45 11 * * 1-5" }; // mirrored in netlify.toml (either place works) :contentReference[oaicite:14]{index=14}
