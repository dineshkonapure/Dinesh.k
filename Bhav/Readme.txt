# Netlify Proxy (prefilled, ready to go)

This repo includes two Netlify Functions that proxy API calls:

- `/.netlify/functions/proxy` — for JSON/text
- `/.netlify/functions/proxy-b64` — for images/binary (Base64)

**Default behavior:** permissive (CORS & hosts allowed) so your app works immediately.  
**Harden later:** add environment variables in Netlify UI to lock down.

## Quick start

```bash
npm i -g netlify-cli
netlify login
netlify init      # pick or create a site
netlify dev       # http://localhost:8888
netlify deploy --prod
