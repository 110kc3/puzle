import { describe, expect, it } from 'vitest';
import {
  warsawDateKey,
  puzzleNumber,
  prevDateKey,
  nextWarsawMidnight,
  LAUNCH_DATE,
} from './date';

describe('warsawDateKey', () => {
  it('formats a plain UTC afternoon', () => {
    expect(warsawDateKey(new Date('2026-07-06T10:00:00Z'))).toBe('2026-07-06');
  });
  it('rolls over at Warsaw midnight in summer (UTC+2)', () => {
    expect(warsawDateKey(new Date('2026-07-05T21:59:00Z'))).toBe('2026-07-05');
    expect(warsawDateKey(new Date('2026-07-05T22:01:00Z'))).toBe('2026-07-06');
  });
  it('rolls over at Warsaw midnight in winter (UTC+1)', () => {
    expect(warsawDateKey(new Date('2026-01-10T22:59:00Z'))).toBe('2026-01-10');
    expect(warsawDateKey(new Date('2026-01-10T23:01:00Z'))).toBe('2026-01-11');
  });
});

describe('puzzleNumber', () => {
  it('is #1 on launch day and counts up', () => {
    expect(puzzleNumber(LAUNCH_DATE)).toBe(1);
    expect(puzzleNumber('2026-07-07')).toBe(2);
    expect(puzzleNumber('2026-08-06')).toBe(32);
  });
});

describe('prevDateKey', () => {
  it('handles month and year boundaries', () => {
    expect(prevDateKey('2026-07-06')).toBe('2026-07-05');
    expect(prevDateKey('2026-07-01')).toBe('2026-06-30');
    expect(prevDateKey('2026-01-01')).toBe('2025-12-31');
  });
});

describe('nextWarsawMidnight', () => {
  it('is 22:00 UTC in summer', () => {
    const now = new Date('2026-07-06T10:00:00Z');
    expect(new Date(nextWarsawMidnight(now)).toISOString()).toBe('2026-07-06T22:00:00.000Z');
  });
  it('is 23:00 UTC in winter', () => {
    const now = new Date('2026-01-10T10:00:00Z');
    expect(new Date(nextWarsawMidnight(now)).toISOString()).toBe('2026-01-10T23:00:00.000Z');
  });
});
