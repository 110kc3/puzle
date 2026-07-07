import { describe, expect, it } from 'vitest';
import { obfuscate, deobfuscate, type RevealPayload } from './obfuscate';

describe('obfuscate/deobfuscate', () => {
  const payload: RevealPayload = {
    a: 2,
    url: 'https://tvrepublika.pl/Polska/Przykład/123',
    note: 'Zażółć gęślą jaźń 🔥',
  };

  it('round-trips Polish characters and emoji', () => {
    const blob = obfuscate(payload, '2026-07-06');
    expect(deobfuscate<RevealPayload>(blob, '2026-07-06')).toEqual(payload);
  });

  it('produces base64 without readable plaintext', () => {
    const blob = obfuscate(payload, '2026-07-06');
    expect(blob).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(blob).not.toContain('tvrepublika');
  });

  it('does not decode with a different day key', () => {
    const blob = obfuscate(payload, '2026-07-06');
    expect(() => deobfuscate<RevealPayload>(blob, '2026-07-07')).toThrow();
  });
});
