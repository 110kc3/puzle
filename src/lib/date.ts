export const WARSAW_TZ = 'Europe/Warsaw';

/** Day #1 of the game — the date of the first published puzzle. */
export const LAUNCH_DATE = '2026-07-06';

const keyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: WARSAW_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date in Warsaw for a given instant, as YYYY-MM-DD. */
export function warsawDateKey(d: Date = new Date()): string {
  return keyFormat.format(d);
}

function utcMidnight(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Sequential puzzle number: #1 on LAUNCH_DATE. */
export function puzzleNumber(dateKey: string): number {
  return Math.round((utcMidnight(dateKey) - utcMidnight(LAUNCH_DATE)) / 86_400_000) + 1;
}

/** The YYYY-MM-DD one calendar day before the given key. */
export function prevDateKey(dateKey: string): string {
  return new Date(utcMidnight(dateKey) - 86_400_000).toISOString().slice(0, 10);
}

/** "6 lipca 2026" */
export function formatPolishDate(dateKey: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(utcMidnight(dateKey)));
}

function warsawOffsetMinutes(d: Date): number {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: WARSAW_TZ,
    timeZoneName: 'longOffset',
  }).formatToParts(d);
  const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * Epoch ms of the next Warsaw midnight (may be off by an hour on the two
 * DST-switch nights per year — it only drives a cosmetic countdown).
 */
export function nextWarsawMidnight(now: Date = new Date()): number {
  const nextUtcMidnight = utcMidnight(warsawDateKey(now)) + 86_400_000;
  return nextUtcMidnight - warsawOffsetMinutes(new Date(nextUtcMidnight)) * 60_000;
}
