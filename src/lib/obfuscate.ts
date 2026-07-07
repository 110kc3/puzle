/**
 * Deliberately weak XOR+base64 obfuscation. The answer and the source URL of
 * a puzzle sit in a static JSON file, and the URL's domain would spoil the
 * game for anyone with DevTools open. This keeps the answer out of casual
 * sight; it is NOT meant to stop anyone determined (the key derivation is
 * public code).
 */

/** What's hidden inside a puzzle's `reveal` blob. */
export interface RevealPayload {
  /** Answer index into OUTLETS. */
  a: number;
  /** Link to the real article, shown after guessing. */
  url: string;
  /** Optional curator note shown after the reveal. */
  note?: string;
  /** Optional lead image (og:image) of the article, shown after the reveal. */
  img?: string;
}

function keyBytes(dateKey: string): Uint8Array {
  return new TextEncoder().encode(`wcw:${dateKey}:nie-podgladaj`);
}

export function obfuscate(payload: unknown, dateKey: string): string {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const key = keyBytes(dateKey);
  const mixed = data.map((b, i) => b ^ key[i % key.length]);
  let bin = '';
  for (const b of mixed) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function deobfuscate<T>(blob: string, dateKey: string): T {
  const bin = atob(blob);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const key = keyBytes(dateKey);
  const data = bytes.map((b, i) => b ^ key[i % key.length]);
  return JSON.parse(new TextDecoder().decode(data)) as T;
}
