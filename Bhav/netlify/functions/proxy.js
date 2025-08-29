// netlify/functions/proxy.js
export const handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  const url = event.queryStringParameters?.url;
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

  try {
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
      return {
        statusCode: 502,
        headers: corsHeaders(),
        body: `Upstream error ${upstream.status}`,
      };
    }

    const text = await upstream.text();
    return {
      statusCode: 200,
      headers: corsHeaders({
        'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      }),
      body: text,
    };
  } catch (err) {
    return { statusCode: 502, headers: corsHeaders(), body: 'Fetch failed' };
  }
};

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    ...extra,
  };
}

function badRequest(msg) {
  return { statusCode: 400, headers: corsHeaders(), body: msg };
}
