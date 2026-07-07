/**
 * wcw-stats — counts everyone's guesses per day so the game can show
 * "tak odpowiadali inni". Cloudflare Worker + D1 (atomic increments,
 * which KV cannot do). Best-effort dedupe: one counted vote per
 * (day, salted IP hash); raw IPs are never stored.
 *
 *   POST /guess  {"date":"2026-07-06","choice":2} → {"counts":[1,2,3,4]}
 *   GET  /stats?date=2026-07-06                   → {"counts":[1,2,3,4]}
 */

// Minimal local D1 types so this file needs no external type packages.
interface D1Result {
  meta: { changes: number };
}
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<D1Result>;
  all<T>(): Promise<{ results: T[] }>;
}
interface D1Database {
  prepare(sql: string): D1Statement;
}

export interface Env {
  DB: D1Database;
  /** Comma-separated origin allowlist; falls back to the defaults below. */
  ALLOWED_ORIGINS?: string;
  /** Secret salt for IP hashing (`wrangler secret put IP_SALT`). */
  IP_SALT?: string;
}

const DEFAULT_ORIGINS =
  'https://110kc3.github.io,http://localhost:5173,http://localhost:4173';

function corsHeaders(req: Request, env: Env): Record<string, string> | null {
  const origin = req.headers.get('origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS).split(',').map((s) => s.trim());
  if (!allowed.includes(origin)) return null;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'origin',
  };
}

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Keep in sync with the outlet cast size in config/outlets.ts. */
const NUM_CHOICES = 6;

async function countsFor(env: Env, day: string): Promise<number[]> {
  const { results } = await env.DB.prepare('SELECT choice, n FROM counts WHERE day = ?')
    .bind(day)
    .all<{ choice: number; n: number }>();
  const out = new Array<number>(NUM_CHOICES).fill(0);
  for (const r of results) if (r.choice >= 0 && r.choice < NUM_CHOICES) out[r.choice] = r.n;
  return out;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS')
      return new Response(null, { status: cors ? 204 : 403, headers: cors ?? {} });
    if (!cors) return new Response('forbidden origin', { status: 403 });

    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, 'content-type': 'application/json' },
      });

    const url = new URL(req.url);
    try {
      if (req.method === 'POST' && url.pathname === '/guess') {
        const body = (await req.json().catch(() => null)) as {
          date?: string;
          choice?: number;
        } | null;
        const date = body?.date ?? '';
        const choice = body?.choice;
        if (
          !DATE_RE.test(date) ||
          typeof choice !== 'number' ||
          !Number.isInteger(choice) ||
          choice < 0 ||
          choice >= NUM_CHOICES
        ) {
          return json({ error: 'bad request' }, 400);
        }
        const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
        const ipHash = await sha256Hex(`${date}|${ip}|${env.IP_SALT ?? 'wcw'}`);
        const inserted = await env.DB.prepare(
          'INSERT OR IGNORE INTO guesses (day, ip_hash, choice) VALUES (?, ?, ?)',
        )
          .bind(date, ipHash, choice)
          .run();
        if (inserted.meta.changes > 0) {
          await env.DB.prepare(
            'INSERT INTO counts (day, choice, n) VALUES (?, ?, 1) ON CONFLICT(day, choice) DO UPDATE SET n = n + 1',
          )
            .bind(date, choice)
            .run();
        }
        return json({ counts: await countsFor(env, date) });
      }

      if (req.method === 'GET' && url.pathname === '/stats') {
        const date = url.searchParams.get('date') ?? '';
        if (!DATE_RE.test(date)) return json({ error: 'bad request' }, 400);
        return json({ counts: await countsFor(env, date) });
      }
    } catch {
      return json({ error: 'server error' }, 500);
    }
    return json({ error: 'not found' }, 404);
  },
};
