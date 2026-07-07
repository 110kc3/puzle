/**
 * Client for the optional Cloudflare Worker that aggregates everyone's
 * guesses (see worker/). When VITE_STATS_URL is unset or the worker is
 * unreachable, every function quietly returns null and the UI simply skips
 * the "how others answered" section.
 */

const STATS_URL = ((import.meta.env.VITE_STATS_URL as string | undefined) ?? '').replace(/\/+$/, '');

function isCounts(v: unknown): v is number[] {
  return Array.isArray(v) && v.length >= 4 && v.every((n) => typeof n === 'number');
}

async function call(path: string, init?: RequestInit): Promise<number[] | null> {
  if (!STATS_URL) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${STATS_URL}${path}`, { ...init, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = (await res.json()) as { counts?: unknown };
    return isCounts(body.counts) ? body.counts : null;
  } catch {
    return null;
  }
}

export function submitGuess(date: string, choice: number): Promise<number[] | null> {
  return call('/guess', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ date, choice }),
  });
}

export function getStats(date: string): Promise<number[] | null> {
  return call(`/stats?date=${date}`);
}
