# puzle — "Wykop czy Wyborcza?"

Archived Polish headline-guessing game and interactive portfolio. Static
Vite/React/Tailwind SPA on GitHub Pages, Polish UI. Current decision and queue:
`TODO.md`. README describes the preserved product and development commands.

## Current boundary (2026-10-19)

- No scheduled content gathering or publishing. `Daily puzzle` was disabled on
  GitHub and `.github/workflows/daily.yml` removed after repeated empty-queue failures.
- Keep the saved collection playable without a backend. The home route is the
  portfolio, `#/gra` is random play, `#/archiwum` is the month-grouped archive.
  `#/d/YYYY-MM-DD` preserves old links; `#/dzienna` opens the latest saved puzzle.
- Do not promise daily updates, fetch today's missing puzzle, add a countdown,
  refill the curation queue or revive growth ideas without a new owner decision.
- No frontend statistics Worker calls, even if a stale `VITE_STATS_URL` exists.
  Worker source remains historical; no external resources were removed.
- Preserve local progress under `wcw:v1` and original puzzle JSON. Archive guesses
  use `live: false`; historical streaks remain visible as historical results.
- Keep the GitHub repository writable for portfolio maintenance. The only Action
  verifies and deploys on main pushes or manual dispatch, not on a schedule.

## Commands

Use Node 22, matching `.github/workflows/deploy.yml`.

- `npm ci`
- `npm run dev` — http://localhost:5173/puzle/ (keep `/puzle/` base path)
- `npm test -- --reporter=dot` / `npm run typecheck` / `npm run build`
- `npm run preview` — preview the production build

Historical commands (mutate preserved data, not routine maintenance):
`npm run gather`, `npm run publish:daily` (`WCW_DATE=…` for a deliberate date override).
The historical scripts use Node/tsx and support both Windows and Linux.

## Data invariants

- `config/outlets.ts` array order is answer order for generated puzzles: append,
  never reorder. Existing puzzles resolve their own stored option order, including
  older four-source puzzles. The archive index is imported by `src/lib/collection.ts`.
- Answers, article URLs and images stay XOR/base64-obfuscated in served puzzle JSON
  (`src/lib/obfuscate.ts`), keyed by date or `pool:<key>`. Anti-spoiler only.
- Tests verify that every indexed puzzle exists and every archive/pool reveal is
  playable against its historical source options. Preserve that integrity.
- Optional external article images must fail gracefully. Gameplay uses saved JSON;
  do not make it depend on live RSS, scrapers, images or stats.
- Historical pipeline details: Wyborcza RSS is ISO-8859-2, its article-page image
  fetch follows the noscript `?squid_js=false` refresh; TV Republika and Zero.pl
  use HTML scrapers in `scripts/adapters.ts`.
- If deliberately reviving the original Worker later, its `NUM_CHOICES` must match
  the cast. Original setup is preserved in `worker/README.md`.

## Closeout

Commit and push scoped changes on the existing branch. Never wait for CI after
pushing: record verification pending in `TODO.md`, report the commit/Actions link,
and inspect that exact run or commit once in the next session.
