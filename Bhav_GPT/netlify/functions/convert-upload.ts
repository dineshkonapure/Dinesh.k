// Bhav_GPT/netlify/functions/convert_upload.ts
import { type Context } from "@netlify/functions";
import { corsHeaders } from "./_shared";

export default async (req: Request, _ctx: Context) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders(),
    });
  }

  // Placeholder implementation: server-side multipart parsing can be added later.
  // For now, the manual convert flow runs client-side; this endpoint simply exists
  // so the function deploys cleanly and the route is reserved.
  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "convert_upload placeholder — manual convert handled client-side for now.",
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    }
  );
};


