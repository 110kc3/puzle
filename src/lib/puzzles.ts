export interface Puzzle {
  id: number;
  date: string;
  headline: string;
  /** The four outlet display names, fixed order (matches config/outlets.ts). */
  options: string[];
  /** Obfuscated RevealPayload — see lib/obfuscate.ts. */
  reveal: string;
}

export interface IndexEntry {
  date: string;
  id: number;
}

/** One endless-mode item: key, headline, obfuscated reveal (key `pool:<k>`). */
export interface PoolItem {
  k: string;
  h: string;
  o: string;
}

export interface PoolFile {
  generatedAt: string;
  /** Outlet display names the pool answers refer to. */
  options: string[];
  items: PoolItem[];
}

const base = import.meta.env.BASE_URL;

export async function fetchPool(): Promise<PoolFile> {
  const res = await fetch(`${base}puzzles/pool.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`pool.json → HTTP ${res.status}`);
  return res.json();
}

export async function fetchIndex(): Promise<IndexEntry[]> {
  const res = await fetch(`${base}puzzles/index.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`index.json → HTTP ${res.status}`);
  return res.json();
}

export async function fetchPuzzle(date: string): Promise<Puzzle | null> {
  const res = await fetch(`${base}puzzles/${date}.json`, { cache: 'no-cache' });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Today's puzzle, or — if the daily publish is late/failed — the newest
 * published one, so visitors never hit a dead end.
 */
export async function fetchTodayOrLatest(
  todayKey: string,
): Promise<{ puzzle: Puzzle; isToday: boolean } | null> {
  const today = await fetchPuzzle(todayKey);
  if (today) return { puzzle: today, isToday: true };
  const index = await fetchIndex().catch(() => [] as IndexEntry[]);
  const past = index
    .filter((e) => e.date <= todayKey)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const entry of past.slice(0, 3)) {
    const p = await fetchPuzzle(entry.date);
    if (p) return { puzzle: p, isToday: false };
  }
  return null;
}
