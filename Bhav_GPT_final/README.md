# Bhav_GPT (React + Netlify Functions)

**One-command deploy to Netlify**, strict CORS, persistent blobs, and modern React UI styled to match your AMFI reference.

## Env
Create a site env var: `HEALTH_SECRET=your-strong-secret`

## Scripts
- `npm run dev` — local SPA dev (Note: CORS restricts API to `https://bhav-gpt.netlify.app` as per spec)
- `npm run build` — Vite build

## Functions (/.netlify/functions/*)
- `health` — `GET /api/health[?secret=HEALTH_SECRET]`
- `fetch-source` — caches NSE/BSE/AMFI/PR to blobs for `date=YYYY-MM-DD`
- `convert` — parses sources, merges (NSE → BSE uniques → AMFI **no dedupe**), emits CSVs & manifest
- `open-all` — downloads all outputs as ZIP (or `mode=tabs` returns JSON)
- `diff` — compares `all_mkt.csv` with previous trading day
- `convert_upload` — multipart upload guard (≤25MB, ≤50 files), saves to `uploads/{date}/…`
- `status` — protected store listing (`?secret=HEALTH_SECRET[&prefix=outputs/2025-08-30]`)

## Frontend
- Dark/Light theme toggle (`src/components/ThemeToggle.tsx`)
- Process & Diff button → hits `/api/*`
- SummaryCard + DiffCard show manifest and metrics

> CORS is intentionally strict to: `https://bhav-gpt.netlify.app`
