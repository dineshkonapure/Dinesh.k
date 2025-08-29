// netlify/functions/proxy.js
// Hardened CORS proxy with host whitelist, timeouts, and size caps.
// Defaults are permissive so your app works immediately. Tighten via env vars.

const { URL } = require("url");
const https = require("https");
const http = require("http");

// -------- Defaults (permissive for compatibility) --------
// ALLOWED_ORIGINS empty => allow all origins (CORS) for now
// ALLOWED_HOSTS empty   => allow all target hosts for now
// TIMEOUT_MS            => 10s
// MAX_BYTES             => 2 MiB
// REQUIRE_TOKEN         => off by default
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const ALLOWED_HOSTS   = (process.env.ALLOWED_HOSTS   || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const TIMEOUT_MS      = parseInt(process.env.TIMEOUT_MS || "10000", 10);
const MAX_BYTES       = parseInt(process.env.MAX_BYTES  || "2097152", 10); // 2 MiB default
const REQUIRE_TOKEN   = process.env.REQUIRE_TOKEN === "1";
const ACCESS_TOKEN    = process.env.ACCESS_TOKEN || "";
const ALLOWED_METHODS = new Set((process.env.ALLOWED_METHODS || "GET,HEAD,POST").split(",").map(s => s.trim().toUpperCase()));

function isPrivateIpHostname(hostname) {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h === "0.0.0.0" || h === "127.0.0.1" || h === "::1"
  );
}

function corsHeaders(origin) {
  const allow = (ALLOWED_ORIGINS.length === 0) || (origin && ALLOWED_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin": allow ? (origin || "*") : "null",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Proxy-Token",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const cors = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (REQUIRE_TOKEN) {
    const token = event.headers["x-proxy-token"] || event.headers["X-Proxy-Token"];
    if (!token || token !== ACCESS_TOKEN) {
      return { statusCode: 401, headers: cors, body: "Unauthorized" };
    }
  }

  const incomingMethod = (event.queryStringParameters?.method || event.httpMethod || "GET").toUpperCase();
  if (!ALLOWED_METHODS.has(incomingMethod)) {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  const url = event.queryStringParameters?.url;
  if (!url) {
    return { statusCode: 400, headers: cors, body: "Missing 'url' parameter" };
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return { statusCode: 400, headers: cors, body: "Invalid URL" };
  }

  if (!["https:", "http:"].includes(target.protocol)) {
    return { statusCode: 400, headers: cors, body: "Unsupported scheme" };
  }
  if (isPrivateIpHostname(target.hostname)) {
    return { statusCode: 400, headers: cors, body: "Disallowed host" };
  }
  if (ALLOWED_HOSTS.length && !ALLOWED_HOSTS.includes(target.hostname.toLowerCase())) {
    return { statusCode: 403, headers: cors, body: "Host not allowed" };
  }

  const client = target.protocol === "https:" ? https : http;
  const requestHeaders = {};
  const forwardable = ["accept", "content-type", "authorization", "user-agent"];
  for (const k of forwardable) {
    const v = event.headers?.[k] || event.headers?.[k.toLowerCase()];
    if (v) requestHeaders[k] = v;
  }
  requestHeaders["accept-encoding"] = "identity";

  const bodyBuffer = event.body && (event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body));
  const hasBody = bodyBuffer && bodyBuffer.length > 0 && ["POST","PUT","PATCH"].includes(incomingMethod);

  const resData = await new Promise((resolve) => {
    const req = client.request(
      {
        method: incomingMethod,
        hostname: target.hostname,
        path: target.pathname + target.search,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        headers: requestHeaders,
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks = [];
        let bytes = 0;

        res.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) {
            req.destroy(new Error("Response too large"));
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const contentType = res.headers["content-type"] || "application/octet-stream";
          const safeHeaders = {
            ...cors,
            "Content-Type": contentType,
            "Cache-Control": "no-store",
          };
          resolve({
            statusCode: res.statusCode || 200,
            headers: safeHeaders,
            body: buf.toString("utf8"), // for JSON/text. Use proxy-b64 for binary.
            isBase64Encoded: false,
          });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("Upstream timeout")));
    req.on("error", (err) => {
      resolve({ statusCode: 502, headers: cors, body: `Upstream error: ${err.message}` });
    });

    if (hasBody) req.write(bodyBuffer);
    req.end();
  });

  return resData;
};
