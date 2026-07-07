export interface DayResult {
  /** Index of the guessed outlet. */
  guess: number;
  correct: boolean;
  /** True when the puzzle was played on its own day — only these count toward streaks. */
  live: boolean;
  /** ISO timestamp of the guess. */
  at: string;
}

/** Endless-mode progress. */
export interface PoolState {
  /** Pool item keys already played (capped, oldest dropped first). */
  played: string[];
  plays: number;
  wins: number;
}

interface SaveData {
  v: 1;
  results: Record<string, DayResult>;
  pool?: PoolState;
}

const KEY = 'wcw:v1';

// In-memory fallback so the game still works with localStorage disabled
// (private mode, blocked cookies) — results just won't survive a reload.
let memory: SaveData = { v: 1, results: {} };

export function loadResults(): Record<string, DayResult> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw) as SaveData;
  } catch {
    // localStorage unavailable — serve the in-memory copy
  }
  return memory.results;
}

export function saveResult(dateKey: string, result: DayResult): Record<string, DayResult> {
  loadResults();
  memory = { ...memory, v: 1, results: { ...memory.results, [dateKey]: result } };
  persist();
  return memory.results;
}

export function loadPoolState(): PoolState {
  loadResults();
  return memory.pool ?? { played: [], plays: 0, wins: 0 };
}

export function recordPoolPlay(key: string, correct: boolean): PoolState {
  const cur = loadPoolState();
  const next: PoolState = {
    played: [...cur.played.filter((k) => k !== key), key].slice(-1000),
    plays: cur.plays + 1,
    wins: cur.wins + (correct ? 1 : 0),
  };
  memory = { ...memory, v: 1, pool: next };
  persist();
  return next;
}

/** Forget which endless-mode items were played (keeps the win tally). */
export function resetPoolPlayed(): PoolState {
  const next: PoolState = { ...loadPoolState(), played: [] };
  memory = { ...memory, v: 1, pool: next };
  persist();
  return next;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // keep the in-memory copy only
  }
}
