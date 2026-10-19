# Project status / current queue

## Current decision — 2026-10-19

Preserve this project as an attractive, playable portfolio archive. Stop recurring
content jobs and their failure emails; no new daily puzzles or growth work.
This request supersedes the historical roadmap below.

## Archive conversion

- Implemented: editorial portfolio landing page, responsive light/dark layout,
  monthly puzzle archive, saved random pool and direct result links.
- Implemented: no current-day fetch, countdown or promises of fresh content;
  historical daily links open the latest saved puzzle, and old progress survives.
- Implemented: frontend no longer contacts the optional statistics Worker.
- GitHub `Daily puzzle` workflow disabled manually on 2026-10-19; scheduled
  workflow removed from source. Latest observed failure was run `39219357147`,
  on commit `c3bf9a306c061bed1cee262f979bdb3837f180d6`: empty curation queue.
- Local verification (Node 22): 27 tests pass, including every one of the 56
  archive and 300 pool reveals; TypeScript and production build pass. Chromium
  checks cover desktop/mobile (320/375/768px), light/dark layouts, both game
  modes, saved results after reload, legacy daily links, missing-date recovery,
  exhausted-pool restart, modal keyboard behavior and no stats-service requests.
  Remote images were blocked to exercise the graceful fallback. Preview captured
  in `docs/portfolio.png`; social card exported to `public/og-image.png`.
- Hosted verification passed on 2026-10-19 for implementation commit `d865101`:
  https://110kc3.github.io/puzle/ serves its exact production JS bundle.
  All 59 hosted puzzle/index/pool/social-card files match the local collection
  byte for byte. Chromium checks passed against the public site for landing,
  both game modes, reload persistence, old daily links, missing-date recovery,
  exhausted-pool restart, modal keyboard behavior, 320/375/768px layouts and
  light/dark themes, with external images blocked and no statistics requests.
- GitHub now lists only `Deploy Pages`; its source has push/manual triggers and
  no schedule. The removed daily pipeline cannot generate scheduled failures.
- The one-time Actions lookup for `d865101` observed
  [run 39220937600](https://github.com/110kc3/puzle/actions/runs/39220937600)
  in progress. Subsequent hosted checks independently verified the deployed
  app as described above. This documentation-only closeout push will have its
  own unobserved Actions run; check it once at the next maintenance session.
  [Branch Actions](https://github.com/110kc3/puzle/actions?query=branch%3Amain).

Archive conversion complete; no accepted implementation tasks remain.
No further feature backlog is accepted. No owner-only setup is currently known.
Keep the GitHub repository writable for occasional maintenance; do not enable the
read-only archive setting or restore scheduled publishing without a new decision.

---

# Historical ideas — deferred, not an active queue

The following is preserved from the live-game phase for context. Its checkboxes
are unselected ideas and old setup notes, not instructions to implement them.
The empty-queue history describes the former publishing model, now retired.

## Przed startem (odhaczyć raz)

- [ ] Pierwszy commit + push na `main`
- [ ] Settings → Pages → Source: **GitHub Actions**
- [ ] Deploy workera statystyk ([worker/README.md](worker/README.md)) + `gh variable set VITE_STATS_URL`
- [ ] Własna domena? (np. `wykopczywyborcza.pl`) — wtedy zmienić `base` w `vite.config.ts`, `SITE_URL` w `src/lib/share.ts` i CORS workera

## Kolejne redakcje (kandydaci do castu)

Dodanie = wpis w `config/outlets.ts` + źródło w `scripts/gather.ts` + `NUM_CHOICES` w workerze.
Uwaga: >6 przycisków robi się ciasno na mobile — powyżej tego progu lepiej
pokazywać real + 5 losowych wabików z większej puli (patrz niżej).

- [x] Onet — RSS `https://wiadomosci.onet.pl/rss`
- [ ] Interia — RSS (`wydarzenia.interia.pl`), centrum/portal
- [ ] RMF24 — RSS, radiowy news
- [ ] TVN24 — sprawdzić RSS, telewizyjny mainstream
- [ ] TVP Info — sprawdzić RSS, media publiczne
- [ ] OKO.press — WordPress (`/feed`), lewicowo-śledczy kontrapunkt dla Republiki
- [ ] wPolityce / Niezależna / Do Rzeczy — prawicowa prasa, prawdopodobnie RSS
- [ ] Rzeczpospolita — konserwatywno-liberalny dziennik
- [ ] Super Express — drugi tabloid (fajny duel z Faktem)
- [ ] Pudelek — tryb specjalny "plotki czy polityka"?

## Rozgrywka

- [ ] **Tryb "duża pula"**: cast rośnie, ale gracz zawsze widzi 6 opcji — prawdziwa + 5 wabików dobranych po spektrum (wymaga zapisania opcji per zagadka, już wspierane przez `puzzle.options`)
- [ ] **Tryb na czas**: 60 sekund, ile trafień dasz radę (bez limitu ma już całą mechanikę)
- [ ] **Pojedynek**: link-wyzwanie z zaszytym seedem (te same 5 nagłówków dla obu graczy, porównanie wyników)
- [ ] **Tryb hardcore**: bez kolorów-podpowiedzi na przyciskach, 10 opcji
- [ ] Filtry kategorii w trybie bez limitu (polityka / sport / lifestyle)
- [x] **Oś lewica↔prawica po odsłonięciu** (wersja statyczna): pozycja `bias` per redakcja w `config/outlets.ts`, markery redakcji (●) i twojego strzału (👤) w panelu po odpowiedzi
- [ ] Oś c.d. — marker "na co to brzmiało wszystkim": średnia głosów z workera ważona pozycjami redakcji (wymaga wdrożonego workera). Uwaga: dla Wykopu/Zero/Faktu lepsza druga oś redakcja↔internet albo poważne↔tabloid niż czysta lewica/prawica
- [ ] Ocena wydźwięku pojedynczego nagłówka przez LLM (cache w `candidates.json` jak og:image) — świadoma zmiana architektury, pipeline jest celowo bez LLM
- [ ] Macierz pomyłek w statystykach („najczęściej mylisz Fakt z Wykopem")
- [ ] Emoji-siatka ostatnich 7 dni w tekście udostępniania (jak Wordle)

## Produkt / dystrybucja

- [ ] Meta-tagi OG + obrazek udostępniania strony (ładna karta na social media)
- [ ] PWA (manifest + ikona) — "zainstaluj na ekranie głównym"
- [ ] Kalendarz w archiwum zamiast listy
- [ ] Lekka analityka bez cookies (Plausible / GoatCounter)
- [ ] Auto-podpowiedzi kuratorskie: heurystyczny ranking kandydatów (długość, brak nazwisk, "ambiguity score") na górze `candidates.json`
- [ ] Powiadomienie/issue na GitHubie, gdy kolejka < 3 (teraz tylko czerwony Action)

> **Kolejka wyczerpała się 2026-07-14 i `Daily puzzle` padał dwa razy dziennie
> przez 11 dni** (`!!! QUEUE EMPTY`). Nic nie było zepsute — `gather` nadal
> cache'uje ~900 kandydatów, `publish` działa; po prostu skończyły się
> wyselekcjonowane wpisy. Uzupełniono 2026-07-25 o 24 zagadki (po 4 na każdą z
> sześciu redakcji, rotacja tak, by dwa kolejne dni nie miały tej samej —
> powtórka zamienia wczorajszą odpowiedź w darmową podpowiedź). **Starczy do
> ok. 2026-08-18.** To dlatego powyższy punkt jest wart zrobienia: czerwony
> Action nikogo nie budzi, a strona po prostu nie ma zagadki na dany dzień.
>
> Uzupełniając ręcznie: wybieraj z `data/candidates.json`, sprawdź `headline`
> względem `data/published.json` (bez powtórek) i trzymaj rotację redakcji.
> `WCW_DATE=YYYY-MM-DD npm run publish:daily` na kopii repo pozwala sprawdzić
> kolejkę bez konsumowania jej naprawdę.

## Techniczne

- [ ] Proxy/cache obrazków (np. wsrv.nl) — odporność na zmiany CDN-ów i hotlink-blokady
- [ ] Reveal po stronie workera (odpowiedź nigdy nie trafia do statycznego JSON-a) — koniec spoilerów z DevTools
- [ ] Test E2E (Playwright): pełna runda w obu trybach, w CI przed deployem
- [ ] Rate-limit/deduplikacja głosów per przeglądarka (localStorage token) obok hasha IP
- [ ] Monitoring adapterów: osobny Action tygodniowo sprawdzający, czy każde źródło zwraca > 0 kandydatów
