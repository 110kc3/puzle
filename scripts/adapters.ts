import { XMLParser } from 'fast-xml-parser';

export interface Candidate {
  title: string;
  url: string;
  /** ISO timestamp from the feed, when available. */
  published?: string;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 wcw-gather/1.0';

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: '*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Decode honoring the XML declaration — Wyborcza's feed is ISO-8859-2. */
function decodeXml(buf: Uint8Array): string {
  const head = new TextDecoder('ascii').decode(buf.subarray(0, 200));
  const enc = head.match(/encoding=["']([\w-]+)["']/i)?.[1]?.toLowerCase() ?? 'utf-8';
  try {
    return new TextDecoder(enc).decode(buf);
  } catch {
    return new TextDecoder().decode(buf);
  }
}

function textOf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return textOf(o['#text'] ?? o['__cdata'] ?? '');
  }
  return '';
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export async function fetchRssCandidates(url: string): Promise<Candidate[]> {
  const xml = decodeXml(await fetchBytes(url));
  const parser = new XMLParser({ ignoreAttributes: true });
  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
  };
  const raw = doc.rss?.channel?.item ?? [];
  const items = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[];
  return items
    .map((it) => {
      const pub = textOf(it.pubDate);
      const ts = pub ? Date.parse(pub) : NaN;
      return {
        title: decodeEntities(textOf(it.title)),
        url: textOf(it.link),
        published: Number.isNaN(ts) ? undefined : new Date(ts).toISOString(),
      };
    })
    .filter((c) => c.title !== '' && c.url.startsWith('http'));
}

/**
 * TV Republika has no RSS (verified 2026-07). Their Drupal homepage renders
 * article teasers as
 *   <a href="/Sekcja/Slug/12345" class="article-{xs|s|m|l|xl}__link">
 *     …<h2 class="article-xl__text"> <div class="decorator"></div> <span>Title</span> …
 *   </a>
 * The title is the first text node after the `__text` heading (sometimes
 * wrapped in a span behind a decorator div), a few kB of image markup deep.
 */
export async function fetchRepublikaCandidates(
  homepage = 'https://tvrepublika.pl',
): Promise<Candidate[]> {
  const html = new TextDecoder().decode(await fetchBytes(homepage + '/'));
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const re =
    /<a\s+href="(\/[^"]+?\/\d+)"\s+class="article-(?:xs|s|m|l|xl)__link"[^>]*>[\s\S]{0,6000}?__text"\s*>(?:\s*<[^>]*>)*\s*([^<]+?)\s*</g;
  for (const m of html.matchAll(re)) {
    const url = homepage + m[1];
    const title = decodeEntities(m[2].trim());
    if (title === '' || seen.has(url)) continue;
    seen.add(url);
    out.push({ title, url });
  }
  return out;
}

/**
 * Zero.pl (Kanał Zero's portal) has no RSS and no public wp-json (verified
 * 2026-07). Its Nuxt homepage renders article teasers as
 *   <a class="absolute inset-0" href="/news/slug" aria-label="Headline">
 * so the display headline is right in the aria-label.
 */
export async function fetchZeroCandidates(homepage = 'https://zero.pl'): Promise<Candidate[]> {
  const html = new TextDecoder().decode(await fetchBytes(homepage + '/'));
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const patterns = [
    /<a\b[^>]*href="(\/news\/[a-z0-9-]+)"[^>]*aria-label="([^"]+)"/g,
    /<a\b[^>]*aria-label="([^"]+)"[^>]*href="(\/news\/[a-z0-9-]+)"/g,
  ];
  for (const [idx, re] of patterns.entries()) {
    for (const m of html.matchAll(re)) {
      const href = idx === 0 ? m[1] : m[2];
      const label = idx === 0 ? m[2] : m[1];
      const url = homepage + href;
      const title = decodeEntities(label.trim());
      if (title === '' || seen.has(url)) continue;
      seen.add(url);
      out.push({ title, url });
    }
  }
  return out;
}

/**
 * Lead image of an article (og:image / twitter:image) — shown after the
 * reveal. Returns undefined when the page has none.
 */
export async function fetchOgImage(url: string, hop = 0): Promise<string | undefined> {
  let html: string;
  try {
    html = new TextDecoder().decode(await fetchBytes(url));
  } catch {
    return undefined;
  }
  const head = html.slice(0, 200_000);
  // Wyborcza serves a JS-challenge stub whose <noscript> meta-refresh points
  // at the real page (…?squid_js=false) — follow that once.
  if (!/og:image/i.test(head) && hop === 0) {
    const refresh = head.match(
      /<noscript>[\s\S]{0,400}?<meta[^>]+Refresh[^>]+URL=([^"'>\s]+)/i,
    );
    if (refresh) return fetchOgImage(decodeEntities(refresh[1]), 1);
  }
  const m =
    head.match(
      /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*content=["']([^"']+)["']/i,
    ) ??
    head.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["']/i,
    );
  const src = m ? decodeEntities(m[1]) : undefined;
  return src?.startsWith('http') ? src : undefined;
}

/**
 * Last-resort adapter if an outlet's feed or markup breaks: Google News
 * search restricted to the domain. Article links are opaque Google
 * redirects, so use only to keep the candidate stream alive until the
 * primary adapter is fixed.
 */
export function googleNewsUrl(domain: string): string {
  return `https://news.google.com/rss/search?q=site:${domain}%20when:2d&hl=pl&gl=PL&ceid=PL:pl`;
}
