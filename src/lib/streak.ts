import { prevDateKey } from './date';
import type { DayResult } from './storage';

/**
 * Consecutive live correct days ending today (or yesterday, when today is
 * still unplayed). A wrong live guess today resets to 0.
 */
export function currentStreak(results: Record<string, DayResult>, todayKey: string): number {
  const today = results[todayKey];
  let day = todayKey;
  if (!(today?.live && today.correct)) {
    if (today?.live && !today.correct) return 0;
    day = prevDateKey(todayKey);
  }
  let n = 0;
  for (;;) {
    const r = results[day];
    if (r?.live && r.correct) {
      n++;
      day = prevDateKey(day);
    } else {
      return n;
    }
  }
}

export function bestStreak(results: Record<string, DayResult>): number {
  const days = Object.keys(results)
    .filter((k) => results[k].live && results[k].correct)
    .sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of days) {
    run = prev !== '' && prevDateKey(d) === prev ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}
