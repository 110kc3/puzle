export const SITE_URL = 'https://110kc3.github.io/puzle/';

export function shareText(id: number, correct: boolean, streak?: number, date?: string): string {
  const line = correct ? '🟩 trafione' : '🟥 pudło';
  const detail = streak === undefined ? 'archiwum' : `seria: ${streak}`;
  const url = date ? `${SITE_URL}#/d/${date}` : SITE_URL;
  return `Wykop czy Wyborcza? #${id}\n${line} · ${detail}\n${url}`;
}

/** Polish plural: plural(5, 'głos', 'głosy', 'głosów') → 'głosów' */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const h = n % 100;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
}
