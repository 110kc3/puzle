import { describe, expect, it } from 'vitest';
import { OUTLETS, resolveOutlets } from './outlets';

describe('OUTLETS config', () => {
  it('has unique ids and names', () => {
    expect(new Set(OUTLETS.map((o) => o.id)).size).toBe(OUTLETS.length);
    expect(new Set(OUTLETS.map((o) => o.name)).size).toBe(OUTLETS.length);
  });
  it('keeps bias on the −1…+1 axis', () => {
    for (const o of OUTLETS) {
      expect(o.bias, o.id).toBeGreaterThanOrEqual(-1);
      expect(o.bias, o.id).toBeLessThanOrEqual(1);
    }
  });
});

describe('resolveOutlets', () => {
  it('maps known names and falls back gracefully for unknown ones', () => {
    const [wyborcza, ghost] = resolveOutlets(['Gazeta Wyborcza', 'Nieistniejąca Gazeta']);
    expect(wyborcza.id).toBe('wyborcza');
    expect(ghost.name).toBe('Nieistniejąca Gazeta');
    expect(ghost.bias).toBe(0);
  });
});
