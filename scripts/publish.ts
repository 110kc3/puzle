/**
 * Publishes today's puzzle: pops the head of data/queue.json, writes
 * public/puzzles/<date>.json (answer obfuscated) and updates index.json.
 * Idempotent — re-running on an already-published day is a no-op. Fails
 * loudly (exit 1) when the queue is empty so the Action turns red.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTLETS, outletIndex, type OutletId } from '../config/outlets';
import { warsawDateKey, puzzleNumber } from '../src/lib/date';
import { obfuscate, type RevealPayload } from '../src/lib/obfuscate';
import { fetchOgImage } from './adapters';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATES_PATH = path.join(ROOT, 'data', 'candidates.json');
const QUEUE_PATH = path.join(ROOT, 'data', 'queue.json');
const LOG_PATH = path.join(ROOT, 'data', 'published.json');
const PUZZLES_DIR = path.join(ROOT, 'public', 'puzzles');
const INDEX_PATH = path.join(PUZZLES_DIR, 'index.json');

interface QueueEntry {
  headline: string;
  outlet: OutletId;
  url: string;
  note?: string;
}

interface QueueFile {
  note?: string;
  queue: QueueEntry[];
}

function fail(msg: string): never {
  console.error('!!! ' + msg);
  process.exit(1);
}

/** Article lead image: from the candidates cache, or fetched live. */
async function findImage(url: string): Promise<string | undefined> {
  try {
    const candidates = JSON.parse(fs.readFileSync(CANDIDATES_PATH, 'utf-8')) as {
      outlets: Record<string, { url: string; image?: string }[]>;
    };
    for (const list of Object.values(candidates.outlets)) {
      const hit = list.find((c) => c.url === url);
      if (hit?.image) return hit.image;
    }
  } catch {
    // no candidates cache — fall through to a live fetch
  }
  return fetchOgImage(url).catch(() => undefined);
}

async function main() {
  // WCW_DATE override is for testing (`WCW_DATE=2026-07-07 npm run publish:daily`).
  const today = process.env.WCW_DATE ?? warsawDateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) fail(`Bad date: ${today}`);

  const puzzlePath = path.join(PUZZLES_DIR, `${today}.json`);
  if (fs.existsSync(puzzlePath)) {
    console.log(`Puzzle for ${today} already published — nothing to do.`);
    return;
  }

  let queueFile: QueueFile;
  try {
    queueFile = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8')) as QueueFile;
  } catch (err) {
    fail(`Cannot read ${QUEUE_PATH}: ${err instanceof Error ? err.message : err}`);
  }
  if (!Array.isArray(queueFile.queue) || queueFile.queue.length === 0) {
    fail(`QUEUE EMPTY — brak zagadki na ${today}. Uzupełnij data/queue.json!`);
  }

  const entry = queueFile.queue.shift()!;
  const answer = outletIndex(entry.outlet);
  if (answer < 0) fail(`Unknown outlet "${entry.outlet}" in queue head.`);
  if (!entry.headline?.trim()) fail('Queue head has an empty headline.');
  if (!entry.url?.startsWith('http')) fail(`Queue head has a bad url: ${entry.url}`);

  const payload: RevealPayload = { a: answer, url: entry.url };
  if (entry.note?.trim()) payload.note = entry.note.trim();
  const img = await findImage(entry.url);
  if (img) payload.img = img;

  const puzzle = {
    id: puzzleNumber(today),
    date: today,
    headline: entry.headline.trim(),
    options: OUTLETS.map((o) => o.name),
    reveal: obfuscate(payload, today),
  };

  fs.mkdirSync(PUZZLES_DIR, { recursive: true });
  fs.writeFileSync(puzzlePath, JSON.stringify(puzzle, null, 2) + '\n', 'utf-8');

  let index: { date: string; id: number }[] = [];
  try {
    index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  } catch {
    // first publish — start a fresh index
  }
  if (!index.some((e) => e.date === today)) index.push({ date: today, id: puzzle.id });
  index.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf-8');

  // Plaintext provenance log (yes, it spoils answers to repo readers —
  // same honor system as Wordle's public word list).
  let log: unknown[] = [];
  try {
    log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  } catch {
    // first publish
  }
  log.push({ date: today, ...entry });
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf-8');

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queueFile, null, 2) + '\n', 'utf-8');

  console.log(`Published #${puzzle.id} for ${today}: "${puzzle.headline}" (${entry.outlet})`);
  if (queueFile.queue.length < 3) {
    console.warn(
      `WARN: only ${queueFile.queue.length} puzzle(s) left in the queue — uzupełnij data/queue.json!`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
