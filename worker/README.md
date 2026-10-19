# wcw-stats worker (historical)

The portfolio frontend no longer calls this service, and the Pages workflow no
longer passes `VITE_STATS_URL`. No Worker or D1 deployment is needed to play.
The source and original setup instructions below are preserved for reference;
restoring stats requires reconnecting the frontend client and build variable.
Existing Cloudflare resources have not been deleted or modified.

Counts everyone's guesses per day so the game can show the "tak odpowiadali
inni" distribution. Cloudflare Workers + D1, fits comfortably in the free
tier. The original live frontend skipped the distribution when the service was unavailable.

## One-time deploy

```sh
cd worker
npm i -g wrangler          # or use npx wrangler
wrangler login
wrangler d1 create wcw-stats
# → paste the returned database_id into wrangler.toml
wrangler d1 execute wcw-stats --remote --file=schema.sql
wrangler secret put IP_SALT    # any random string
wrangler deploy
# → note the URL, e.g. https://wcw-stats.<account>.workers.dev
```

Then point the site at it (baked in at build time):

```sh
gh variable set VITE_STATS_URL --body "https://wcw-stats.<account>.workers.dev"
```

and re-run the "Deploy Pages" workflow. For local dev put the same value in
`.env.local` at the repo root.

## Smoke test

```sh
wrangler dev   # local, uses a local D1
curl -X POST http://localhost:8787/guess \
  -H 'content-type: application/json' -H 'origin: http://localhost:5173' \
  -d '{"date":"2026-07-06","choice":1}'
curl 'http://localhost:8787/stats?date=2026-07-06' -H 'origin: http://localhost:5173'
```

Notes: one counted vote per (day, salted IP hash) — repeat votes return
current counts without incrementing. Raw IPs are never stored. CORS is
locked to the Pages origin + localhost (override with the
`ALLOWED_ORIGINS` var).

`NUM_CHOICES` in `src/index.ts` must match the outlet cast size in
`config/outlets.ts` (currently 6) — bump it and `wrangler deploy` whenever
an outlet joins the game.
