import { describe, expect, it } from 'vitest';
import { shareText, plural } from './share';

describe('shareText', () => {
  it('never leaks the answer', () => {
    const t = shareText(37, false, 0);
    expect(t).toContain('Wykop czy Wyborcza? #37');
    expect(t).toContain('🟥 pudło');
    expect(t).toContain('seria: 0');
    expect(t).not.toMatch(/Wyborcza\?[\s\S]*Wyborcza/); // only the title mentions an outlet
  });
  it('marks wins green', () => {
    expect(shareText(1, true, 5)).toContain('🟩 trafione');
  });
  it('shares an archived puzzle with a direct link and no live streak', () => {
    const text = shareText(75, true, undefined, '2026-09-18');
    expect(text).toContain('archiwum');
    expect(text).toContain('/puzle/#/d/2026-09-18');
    expect(text).not.toContain('seria:');
  });
});

describe('plural', () => {
  it('handles Polish plural forms', () => {
    expect(plural(1, 'głos', 'głosy', 'głosów')).toBe('głos');
    expect(plural(3, 'głos', 'głosy', 'głosów')).toBe('głosy');
    expect(plural(5, 'głos', 'głosy', 'głosów')).toBe('głosów');
    expect(plural(12, 'głos', 'głosy', 'głosów')).toBe('głosów');
    expect(plural(22, 'głos', 'głosy', 'głosów')).toBe('głosy');
    expect(plural(112, 'głos', 'głosy', 'głosów')).toBe('głosów');
  });
});
