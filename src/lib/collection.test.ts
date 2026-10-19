import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { archiveEntries, firstDate, latestDate } from './collection';
import { deobfuscate, type RevealPayload } from './obfuscate';
import { type PoolFile, type Puzzle } from './puzzles';
import { OUTLETS } from '../../config/outlets';

const dataDir = new URL('../../public/puzzles/', import.meta.url);
const read = (file: string) => JSON.parse(readFileSync(new URL(file, dataDir), 'utf8'));

function checkReveal(blob: string, key: string, options: string[]) {
  const reveal = deobfuscate<RevealPayload>(blob, key);
  expect(Number.isInteger(reveal.a)).toBe(true);
  expect(reveal.a).toBeGreaterThanOrEqual(0);
  expect(reveal.a).toBeLessThan(options.length);
  expect(new URL(reveal.url).protocol).toMatch(/^https?:$/);
  expect(blob).not.toContain(reveal.url);
  for (const name of options) expect(OUTLETS.some((o) => o.name === name)).toBe(true);
}

describe('frozen portfolio collection', () => {
  it('links every published file exactly once, newest first, independently of today', () => {
    const dates = archiveEntries.map((e) => e.date);
    const files = readdirSync(dataDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates.map((d) => `${d}.json`).sort()).toEqual(files.sort());
    expect(firstDate).toBe('2026-07-06');
    expect(latestDate).toBe('2026-09-18');
  });

  it('can reveal every archived puzzle using its own historical outlet order', () => {
    for (const entry of archiveEntries) {
      const puzzle = read(`${entry.date}.json`) as Puzzle;
      expect(puzzle.date).toBe(entry.date);
      expect(puzzle.id).toBe(entry.id);
      expect(puzzle.headline.trim()).not.toBe('');
      checkReveal(puzzle.reveal, puzzle.date, puzzle.options);
    }
  });

  it('keeps a nonempty, uniquely keyed and fully playable random pool', () => {
    const pool = read('pool.json') as PoolFile;
    expect(pool.items.length).toBeGreaterThan(0);
    expect(new Set(pool.items.map((i) => i.k)).size).toBe(pool.items.length);
    for (const item of pool.items) {
      expect(item.h.trim()).not.toBe('');
      checkReveal(item.o, `pool:${item.k}`, pool.options);
    }
  });
});
