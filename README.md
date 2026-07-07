# Wykop czy Wyborcza?

Prawdziwe nagłówki z polskich mediów, bez podpisu. Zgadnij, kto to
opublikował — Gazeta Wyborcza, Wykop, TV Republika, Fakt, Zero.pl czy Onet.
Po odpowiedzi: źródło, zdjęcie z artykułu, link do oryginału i pozycja
redakcji na umownej osi lewica↔prawica (obok twojego strzału).

Dwa tryby: **∞ Bez limitu** (losowe nagłówki z ostatnich dni, graj ile
chcesz — strona główna) i **📅 Codzienna** (jedna wspólna zagadka dziennie,
seria 🔥, porównanie z innymi, wynik do udostępnienia).

Live: https://110kc3.github.io/puzle/ · Roadmap: [TODO.md](TODO.md)

## How it works

- **Static SPA** (Vite + React + Tailwind) on GitHub Pages. Each day's puzzle
  is a JSON file in `public/puzzles/`, committed by a scheduled GitHub Action.
- **Gathering**: `npm run gather` pulls recent headlines from all six
  outlets into `data/candidates.json` (RSS for Wyborcza/Wykop/Fakt/Onet,
  HTML scrapes for TV Republika and Zero.pl, which have no feeds), enriches new
  entries with the article's `og:image`, and regenerates the endless-mode
  pool `public/puzzles/pool.json` (~300 obfuscated mini-puzzles, interleaved
  across outlets, minus anything queued or already used as a daily). Runs
  automatically twice a day.
- **Curation (the weekly 10 minutes)**: skim `data/candidates.json`, copy the
  best ~7 picks into `data/queue.json` — exact title, `outlet` id, article
  `url`, optional `note` shown after the reveal. Ambiguous headlines make the
  best puzzles; the Action turns red when the queue runs dry.
- **Publishing**: `npm run publish:daily` pops the queue head and writes
  `public/puzzles/<today>.json` (Europe/Warsaw). The answer, source URL and
  article image are XOR-obfuscated so DevTools doesn't spoil the game (repo
  readers can still spoil themselves — same honor system as Wordle's word
  list).
- **Global stats** (optional): a tiny Cloudflare Worker + D1 counts guesses —
  see [worker/README.md](worker/README.md). Without it the game simply skips
  the "tak odpowiadali inni" section. When the outlet cast grows, bump
  `NUM_CHOICES` in `worker/src/index.ts` and redeploy.

## Repo map

```
config/outlets.ts     the cast: names, colors, giveaway words, bias (oś mediów)
scripts/              pipeline: adapters.ts (per-outlet fetchers), gather.ts, publish.ts
data/                 candidates.json (gathered), queue.json (curated), published.json (log)
public/puzzles/       served data: <date>.json, index.json, pool.json (endless mode)
src/                  the SPA: lib/ (pure logic, unit-tested), components/
worker/               Cloudflare Worker + D1 for global guess distribution
.github/workflows/    daily.yml (gather+publish+deploy), deploy.yml (Pages)
```

## Development

```sh
npm install
npm run dev        # http://localhost:5173/puzle/
npm test           # vitest: date keying, obfuscation, streaks, share text, outlet config
npm run typecheck
npm run gather     # fetch candidates + og:images, regenerate endless pool
npm run publish:daily            # publish today's puzzle from the queue
WCW_DATE=2026-07-08 npm run publish:daily   # publish for another date (testing)
```

## Verified sources (2026-07)

| Outlet | Source |
| --- | --- |
| Gazeta Wyborcza | RSS `https://wyborcza.pl/pub/rss/najnowsze_wyborcza.xml` (ISO-8859-2) |
| Wykop | RSS `https://wykop.pl/rss` (titles of user-submitted znaleziska) |
| Fakt | RSS `https://www.fakt.pl/rss` |
| TV Republika | no RSS — homepage scrape (`article-*__link` teasers); Google News RSS as last resort |
| Zero.pl | no RSS/wp-json — homepage scrape (`/news/…` anchors, headline in `aria-label`) |
| Onet | RSS `https://wiadomosci.onet.pl/rss` |

Adapters live in `scripts/adapters.ts`; the outlet cast (names, colors,
giveaway words) in `config/outlets.ts`.

## One-time setup after pushing

1. **Pages**: repo Settings → Pages → Source: **GitHub Actions**.
2. **First deploy**: push to `main` (or run the "Deploy Pages" workflow).
3. **Daily pipeline**: nothing to do — `daily.yml` runs at 02:30/13:30 UTC.
   Its commits keep the schedule from GitHub's 60-day auto-disable.
4. **Stats worker** (optional): follow [worker/README.md](worker/README.md),
   then `gh variable set VITE_STATS_URL --body "https://…workers.dev"`.

## Legal note

Headlines are quoted verbatim with attribution and a link to the original
article (right of quotation); no article bodies are stored or reproduced.
