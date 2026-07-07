/**
 * Fetches recent headlines from all outlets into data/candidates.json,
 * enriches new entries with their og:image, and regenerates the endless-mode
 * pool (public/puzzles/pool.json). Run by the daily GitHub Action (and by
 * hand: `npm run gather`). The human curator skims candidates weekly and
 * moves picks into data/queue.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTLETS, outletIndex, type OutletId } from '../config/outlets';
import { obfuscate, type RevealPayload } from '../src/lib/obfuscate';
import {
  fetchRssCandidates,
  fetchRepublikaCandidates,
  fetchZeroCandidates,
  fetchOgImage,
  type Candidate,
} from './adapters';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATES_PATH = path.join(ROOT, 'data', 'candidates.json');
const QUEUE_PATH = path.join(ROOT, 'data', 'queue.json');
const PUBLISHED_PATH = path.join(ROOT, 'data', 'published.json');
const POOL_PATH = path.join(ROOT, 'public', 'puzzles', 'pool.json');

const SOURCES: Record<OutletId, () => Promise<Candidate[]>> = {
  wyborcza: () => fetchRssCandidates('https://wyborcza.pl/pub/rss/najnowsze_wyborcza.xml'),
  wykop: () => fetchRssCandidates('https://wykop.pl/rss'),
  fakt: () => fetchRssCandidates('https://www.fakt.pl/rss'),
  republika: () => fetchRepublikaCandidates(),
  zero: () => fetchZeroCandidates(),
  onet: () => fetchRssCandidates('https://wiadomosci.onet.pl/rss'),
};

/**
 * Hard taste filter: death/tragedy headlines make lousy party games. The
 * curator makes the final call anyway — this just keeps the noise down.
 */
const BLACKLIST = [
  'nie żyje',
  'zginął',
  'zginęł',
  'zginęli',
  'zmarł',
  'śmierć',
  'śmierci',
  'śmiertelne',
  'śmiertelny',
  'tragedia',
  'tragiczn',
  'pogrzeb',
  'zwłoki',
  'morderstw',
  'zabójstw',
  'zabił',
  'zabity',
  'utonął',
  'utonęł',
  'gwałt',
  'molestow',
  'pedofil',
];

interface StoredCandidate extends Candidate {
  fetchedAt: string;
  /** og:image of the article; '' = looked and found none. */
  image?: string;
}

interface CandidatesFile {
  updatedAt: string;
  note: string;
  outlets: Record<OutletId, StoredCandidate[]>;
}

const MAX_PER_OUTLET = 150;

function passesFilters(c: Candidate, selfNames: string[]): boolean {
  const len = c.title.length;
  if (len < 25 || len > 170) return false;
  const lower = c.title.toLowerCase();
  if (selfNames.some((s) => lower.includes(s.toLowerCase()))) return false;
  if (BLACKLIST.some((w) => lower.includes(w))) return false;
  return true;
}

function normTitle(t: string): string {
  return t.toLowerCase().replace(/\s+/g, ' ').trim();
}

function loadExisting(): CandidatesFile {
  const empty: CandidatesFile = {
    updatedAt: '',
    note: '',
    outlets: { wyborcza: [], wykop: [], republika: [], fakt: [], zero: [], onet: [] },
  };
  try {
    const parsed = JSON.parse(fs.readFileSync(CANDIDATES_PATH, 'utf-8')) as CandidatesFile;
    parsed.outlets = { ...empty.outlets, ...parsed.outlets };
    return parsed;
  } catch {
    return empty;
  }
}

async function mapLimit<T>(items: T[], limit: number, fn: (t: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    }),
  );
}

function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const POOL_MAX = 300;

/**
 * Endless-mode pool: every gathered candidate (minus anything queued or
 * already published as a daily) becomes a self-contained mini-puzzle with an
 * obfuscated answer, interleaved round-robin across outlets for variety.
 */
function buildPool(candidates: CandidatesFile) {
  const used = new Set<string>();
  try {
    const q = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8')) as { queue?: { url: string }[] };
    for (const e of q.queue ?? []) used.add(e.url);
  } catch {
    // no queue yet
  }
  try {
    const log = JSON.parse(fs.readFileSync(PUBLISHED_PATH, 'utf-8')) as { url: string }[];
    for (const e of log) used.add(e.url);
  } catch {
    // nothing published yet
  }

  const perOutlet = OUTLETS.map((o) =>
    shuffled((candidates.outlets[o.id] ?? []).filter((c) => !used.has(c.url))),
  );
  const items: { k: string; h: string; o: string }[] = [];
  const seen = new Set<string>();
  for (let round = 0; items.length < POOL_MAX; round++) {
    let took = false;
    for (let oi = 0; oi < OUTLETS.length && items.length < POOL_MAX; oi++) {
      const c = perOutlet[oi][round];
      if (!c) continue;
      const k = fnv1a(c.url);
      if (seen.has(k)) continue;
      seen.add(k);
      const payload: RevealPayload = { a: outletIndex(OUTLETS[oi].id), url: c.url };
      if (c.image) payload.img = c.image;
      items.push({ k, h: c.title, o: obfuscate(payload, `pool:${k}`) });
      took = true;
    }
    if (!took) break;
  }

  fs.mkdirSync(path.dirname(POOL_PATH), { recursive: true });
  fs.writeFileSync(
    POOL_PATH,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), options: OUTLETS.map((o) => o.name), items },
      null,
      1,
    ) + '\n',
    'utf-8',
  );
  console.log(`Pool: ${items.length} items → ${POOL_PATH}`);
}

async function main() {
  const existing = loadExisting();
  const now = new Date().toISOString();
  const failures: string[] = [];

  for (const outlet of OUTLETS) {
    let fresh: Candidate[] = [];
    try {
      fresh = await SOURCES[outlet.id]();
    } catch (err) {
      failures.push(`${outlet.id}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const kept = fresh.filter((c) => passesFilters(c, outlet.selfNames));
    // Fresh feed items win the dedupe (newest metadata), but must not lose
    // the og:image already fetched for the same URL on a previous run.
    const knownImages = new Map<string, string>();
    for (const c of existing.outlets[outlet.id] ?? []) {
      if (c.image !== undefined) knownImages.set(c.url, c.image);
    }
    const seen = new Set<string>();
    const merged: StoredCandidate[] = [];
    for (const c of [
      ...kept.map((c) => ({ ...c, fetchedAt: now, image: knownImages.get(c.url) })),
      ...(existing.outlets[outlet.id] ?? []),
    ]) {
      const key = c.url + '|' + normTitle(c.title);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(c);
    }
    merged.sort((a, b) =>
      (b.published ?? b.fetchedAt).localeCompare(a.published ?? a.fetchedAt),
    );
    existing.outlets[outlet.id] = merged.slice(0, MAX_PER_OUTLET);
    console.log(
      `${outlet.id.padEnd(10)} +${kept.length} fresh (of ${fresh.length} fetched), ${existing.outlets[outlet.id].length} kept`,
    );
  }

  if (failures.length === OUTLETS.length) {
    console.error('All sources failed:\n  ' + failures.join('\n  '));
    process.exit(1);
  }
  for (const f of failures) console.warn('WARN source failed — ' + f);

  // Enrich new candidates with their article's og:image (shown after the
  // reveal). '' marks a page we already checked that has none.
  const needingImage = OUTLETS.flatMap((o) =>
    (existing.outlets[o.id] ?? []).filter((c) => c.image === undefined),
  );
  if (needingImage.length > 0) {
    console.log(`Fetching og:image for ${needingImage.length} new candidate(s)…`);
    await mapLimit(needingImage, 6, async (c) => {
      c.image = (await fetchOgImage(c.url).catch(() => undefined)) ?? '';
    });
    console.log(
      `  images found: ${needingImage.filter((c) => c.image !== '').length}/${needingImage.length}`,
    );
  }

  existing.updatedAt = now;
  existing.note =
    'Kandydaci na zagadki. Raz w tygodniu wybierz najlepsze i przenieś do data/queue.json (patrz README).';
  fs.mkdirSync(path.dirname(CANDIDATES_PATH), { recursive: true });
  fs.writeFileSync(CANDIDATES_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${CANDIDATES_PATH}`);

  buildPool(existing);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
