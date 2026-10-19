import { useCallback, useEffect, useState } from 'react';
import { resolveOutlets } from '../../config/outlets';
import { formatPolishDate } from '../lib/date';
import { deobfuscate, type RevealPayload } from '../lib/obfuscate';
import { fetchPuzzle, type Puzzle } from '../lib/puzzles';
import { loadResults, saveResult, type DayResult } from '../lib/storage';
import { latestDate } from '../lib/collection';
import { shareText } from '../lib/share';
import GuessButtons from './GuessButtons';
import ArticleImage from './ArticleImage';
import BiasAxis from './BiasAxis';

interface Props {
  /** Defaults to the latest saved puzzle. Never requests the current day. */
  archiveDate?: string;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; puzzle: Puzzle };

export default function PuzzlePage({ archiveDate }: Props) {
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [result, setResult] = useState<DayResult | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPuzzle(archiveDate ?? latestDate)
      .then((p) => p ? { puzzle: p } : null)
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
        }
      })
      .catch(() => !cancelled && setLoad({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
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
        live: false,
        at: new Date().toISOString(),
      };
      saveResult(puzzle.date, r);
      setResult(r);
      setReveal(payload);
    },
    [load, result],
  );

  if (load.kind === 'loading')
    return <p className="py-12 text-center text-sm text-stone-500">Wczytywanie…</p>;
  if (load.kind === 'error')
    return (
      <p className="py-12 text-center text-sm">
        <a href="#/archiwum" className="block underline underline-offset-2">Wróć do archiwum</a>
        Nie udało się wczytać zagadki. Spróbuj odświeżyć stronę lub wróć do archiwum.
      </p>
    );

  const { puzzle } = load;
  const options = resolveOutlets(puzzle.options);

  const onShare = async () => {
    const text = shareText(puzzle.id, result!.correct, undefined, puzzle.date);
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
      <p className="mb-4 text-center text-xs text-stone-500 dark:text-zinc-400">
        <a href="#/archiwum" className="underline decoration-dotted underline-offset-2">← archiwum</a>
        {' · zagadka archiwalna'}
      </p>

      <h1 className="text-center text-xs uppercase tracking-widest text-stone-500 dark:text-zinc-400">
        Zagadka #{puzzle.id} · {formatPolishDate(puzzle.date)}
      </h1>

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

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onShare}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {copied ? 'Skopiowano!' : 'Udostępnij'}
            </button>
          </div>

          <p className="mt-4 text-center text-sm">
            <a href="#/gra" className="underline underline-offset-2">Zagraj w losowe nagłówki →</a>
          </p>
        </div>
      )}
    </div>
  );
}
