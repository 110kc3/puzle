import { describe, expect, it } from 'vitest';
import { currentStreak, bestStreak } from './streak';
import type { DayResult } from './storage';

function r(correct: boolean, live = true): DayResult {
  return { guess: 0, correct, live, at: '2026-07-06T08:00:00Z' };
}

describe('currentStreak', () => {
  it('counts consecutive correct days ending today', () => {
    const results = { '2026-07-04': r(true), '2026-07-05': r(true), '2026-07-06': r(true) };
    expect(currentStreak(results, '2026-07-06')).toBe(3);
  });
  it('survives today being unplayed yet', () => {
    const results = { '2026-07-04': r(true), '2026-07-05': r(true) };
    expect(currentStreak(results, '2026-07-06')).toBe(2);
  });
  it('resets on a wrong live guess today', () => {
    const results = { '2026-07-05': r(true), '2026-07-06': r(false) };
    expect(currentStreak(results, '2026-07-06')).toBe(0);
  });
  it('breaks across gaps', () => {
    const results = { '2026-07-02': r(true), '2026-07-04': r(true), '2026-07-06': r(true) };
    expect(currentStreak(results, '2026-07-06')).toBe(1);
  });
  it('ignores archive (non-live) plays', () => {
    const results = { '2026-07-05': r(true, false), '2026-07-06': r(true) };
    expect(currentStreak(results, '2026-07-06')).toBe(1);
  });
});

describe('bestStreak', () => {
  it('finds the longest historical run of live correct days', () => {
    const results = {
      '2026-06-01': r(true),
      '2026-06-02': r(true),
      '2026-06-03': r(true),
      '2026-06-05': r(true),
      '2026-06-06': r(false),
      '2026-06-07': r(true),
    };
    expect(bestStreak(results)).toBe(3);
  });
  it('is 0 with no wins', () => {
    expect(bestStreak({ '2026-06-01': r(false) })).toBe(0);
  });
});
