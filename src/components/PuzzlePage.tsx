import { useCallback, useEffect, useState } from 'react';
import { resolveOutlets } from '../../config/outlets';
import { warsawDateKey, formatPolishDate, nextWarsawMidnight } from '../lib/date';
import { deobfuscate, type RevealPayload } from '../lib/obfuscate';
import { fetchPuzzle, fetchTodayOrLatest, type Puzzle } from '../lib/puzzles';
import { loadResults, saveResult, type DayResult } from '../lib/storage';
import { currentStreak } from '../lib/streak';
import { shareText } from '../lib/share';
import { submitGuess, getStats } from '../lib/stats';
import DistributionBars from './DistributionBars';
import GuessButtons from './GuessButtons';
import ArticleImage from './ArticleImage';
import BiasAxis from './BiasAxis';

interface Props {
  /** When set, renders that day from the archive instead of today. */
  archiveDate?: string;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; puzzle: Puzzle; isToday: boolean };

export default function PuzzlePage({ archiveDate }: Props) {
  const todayKey = warsawDateKey();
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [result, setResult] = useState<DayResult | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [counts, setCounts] = useState<number[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (archiveDate
      ? fetchPuzzle(archiveDate).then((p) =>
          p ? { puzzle: p, isToday: archiveDate === todayKey } : null,
        )
      : fetchTodayOrLatest(todayKey)
    )
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setLoad({ kind: 'error' });
          return;
        }
        setLoad({ kind: 'ready', ...res });
        const existing = loadResults()[res.puzzle.date];
        if (existing) {
          setResult(existing);
          try {
            setReveal(deobfuscate<RevealPayload>(res.puzzle.reveal, res.puzzle.date));
          } catch {
            // corrupted blob — leave the reveal panel off
          }
          getStats(res.puzzle.date).then((c) => !cancelled && setCounts(c));
        }
      })
      .catch(() => !cancelled && setLoad({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
    // todayKey changes only at midnight; archiveDate remounts via key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveDate]);

  const onGuess = useCallback(
    (i: number) => {
      if (load.kind !== 'ready' || result) return;
      const { puzzle } = load;
      let payload: RevealPayload;
      try {
        payload = deobfuscate<RevealPayload>(puzzle.reveal, puzzle.date);
      } catch {
        setLoad({ kind: 'error' });
        return;
      }
      const r: DayResult = {
        guess: i,
        correct: i === payload.a,
        live: puzzle.date === todayKey,
        at: new Date().toISOString(),
      };
      saveResult(puzzle.date, r);
      setResult(r);
      setReveal(payload);
      submitGuess(puzzle.date, i).then(setCounts);
    },
    [load, result, todayKey],
  );

  if (load.kind === 'loading')
    return <p className="py-12 text-center text-sm text-stone-500">Wczytywanie…</p>;
  if (load.kind === 'error')
    return (
      <p className="py-12 text-center text-sm">
        Nie udało się wczytać zagadki. Spróbuj odświeżyć stronę.
      </p>
    );

  const { puzzle, isToday } = load;
  const options = resolveOutlets(puzzle.options);
  const streak = currentStreak(loadResults(), todayKey);

  const onShare = async () => {
    const text = shareText(puzzle.id, result!.correct, streak);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      // user cancelled the share sheet — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing sensible to do
    }
  };

  return (
    <div>
      {!isToday && !archiveDate && (
        <p className="mb-4 rounded-xl bg-amber-100 px-4 py-2 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Dzisiejsza zagadka jeszcze nie wylądowała — pokazujemy nagłówek z{' '}
          {formatPolishDate(puzzle.date)}.
        </p>
      )}
      {archiveDate && (
        <p className="mb-4 text-center text-xs text-stone-500 dark:text-zinc-400">
          <a href="#/archiwum" className="underline decoration-dotted underline-offset-2">
            ← archiwum
          </a>
          {!isToday && ' · zagadka archiwalna (nie liczy się do serii)'}
        </p>
      )}

      <p className="text-center text-xs uppercase tracking-widest text-stone-500 dark:text-zinc-400">
        Zagadka #{puzzle.id} · {formatPolishDate(puzzle.date)}
      </p>

      <figure className="my-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <blockquote className="text-balance font-serif text-2xl leading-snug">
          „{puzzle.headline}”
        </blockquote>
      </figure>

      <p className="mb-3 text-center text-sm font-medium">Kto to opublikował?</p>

      <GuessButtons
        options={options}
        answer={reveal?.a ?? null}
        guess={result?.guess ?? null}
        onGuess={onGuess}
      />

      {result && reveal && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
          <p className="text-center text-lg font-bold">
            {result.correct ? 'Trafione! 🎯' : 'Pudło!'}
          </p>
          <p className="mt-1 text-center text-sm text-stone-600 dark:text-zinc-300">
            To {options[reveal.a]?.name ?? '…'}.{' '}
            <a
              href={reveal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2"
            >
              Przeczytaj artykuł ↗
            </a>
          </p>
          {reveal.note && (
            <p className="mt-2 text-center text-sm text-stone-500 italic dark:text-zinc-400">
              💬 {reveal.note}
            </p>
          )}

          {reveal.img && (
            <ArticleImage
              src={reveal.img}
              href={reveal.url}
              alt={`Artykuł — ${options[reveal.a]?.name ?? ''}`}
            />
          )}

          {options[reveal.a] && options[result.guess] && (
            <BiasAxis answer={options[reveal.a]} guess={options[result.guess]} />
          )}

          {counts && (
            <DistributionBars
              counts={counts}
              answer={reveal.a}
              mine={result.guess}
              options={options}
            />
          )}

          <div className="mt-4 flex items-center justify-center gap-4">
            {result.live && (
              <span className="text-sm">
                Seria: <strong>{streak}</strong> {streak > 0 ? '🔥' : ''}
              </span>
            )}
            <button
              type="button"
              onClick={onShare}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {copied ? 'Skopiowano!' : 'Udostępnij'}
            </button>
          </div>

          {isToday && <Countdown />}
        </div>
      )}
    </div>
  );
}

function Countdown() {
  const [left, setLeft] = useState(() => nextWarsawMidnight() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(nextWarsawMidnight() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (left <= 0)
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
      >
        Nowa zagadka jest już dostępna — odśwież
      </button>
    );

  const s = Math.floor(left / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (
    <p className="mt-4 text-center text-xs text-stone-500 dark:text-zinc-400">
      Nowy nagłówek za <span className="tabular-nums">{`${hh}:${mm}:${ss}`}</span>
    </p>
  );
}
