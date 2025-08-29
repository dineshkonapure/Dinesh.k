// netlify/functions/proxy-b64.js
export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(req.url).searchParams.get('url');
  if (!url) return badRequest('Missing ?url=');

  const allowed = [
    'portal.amfiindia.com',
    'archives.nseindia.com',
    'nsearchives.nseindia.com',
    'www.bseindia.com',
  ];

  try {
    const u = new URL(url);
    if (!allowed.includes(u.hostname)) {
      return badRequest('Host not allowed: ' + u.hostname);
    }
  } catch {
    return badRequest('Invalid URL');
  }

  const upstream = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://www.nseindia.com/',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
      status: 502,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  // FIX: Use Buffer (Node) instead of btoa (not available in Node)
  const arrayBuf = await upstream.arrayBuffer();
  const b64 = Buffer.from(arrayBuf).toString('base64');

  return new Response(
    JSON.stringify({
      base64: b64,
      contentType:
        upstream.headers.get('content-type') || 'application/octet-stream',
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
