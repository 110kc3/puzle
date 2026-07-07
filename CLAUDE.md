# puzle — "Wykop czy Wyborcza?"

Daily Polish headline-guessing game (Wordle model) + endless mode. Static
Vite/React/Tailwind SPA on GitHub Pages; puzzle data is JSON committed by a
scheduled Action. Polish UI, Europe/Warsaw day keying, launch date 2026-07-06.

## Commands

- `npm run dev` — http://localhost:5173/puzle/ (note the `/puzle/` base path)
- `npm test` / `npm run typecheck` / `npm run build`
- `npm run gather` — fetch candidates from all outlets + og:images, regenerate `public/puzzles/pool.json`
- `npm run publish:daily` — pop `data/queue.json` head → today's puzzle (idempotent; `WCW_DATE=…` to override the date)

## Invariants that bite

- The outlet cast lives in `config/outlets.ts`; array **order = answer index**
  in obfuscated reveal blobs. Append new outlets at the end, never reorder.
- When the cast grows: bump `NUM_CHOICES` in `worker/src/index.ts`, add the
  source in `scripts/gather.ts` (SOURCES + `loadExisting` empty object).
- Answers, article URLs and og:images are XOR+base64 obfuscated
  (`src/lib/obfuscate.ts`) — anti-DevTools-spoiler only, key is derived from
  the date (daily) or `pool:<key>` (endless). Never put them in plaintext in
  served JSON.
- Scripts run on Windows (dev) and ubuntu (Actions): Node/tsx only, no bash-isms.
- Wyborcza quirks: RSS is ISO-8859-2; article pages serve a JS-challenge stub —
  `fetchOgImage` follows the `<noscript>` meta-refresh (`?squid_js=false`).
- TV Republika and Zero.pl have no feeds — HTML scrapers in `scripts/adapters.ts`
  (fragile by nature; if one breaks, check the current markup first).
- Pushes made by the Action's GITHUB_TOKEN don't trigger `on: push` workflows —
  that's why `daily.yml` calls `deploy.yml` explicitly via `workflow_call`.

## Weekly human ritual

Skim `data/candidates.json`, move ~7 ambiguous picks into `data/queue.json`
(exact title, outlet id, url). The daily Action fails red when the queue is empty.

Roadmap ideas: `TODO.md`. Worker deploy: `worker/README.md`.
