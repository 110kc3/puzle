import { useEffect, useState } from 'react';
import { resolveOutlets } from '../../config/outlets';
import { deobfuscate, type RevealPayload } from '../lib/obfuscate';
import { fetchPool, type PoolFile, type PoolItem } from '../lib/puzzles';
import { loadPoolState, recordPoolPlay, resetPoolPlayed } from '../lib/storage';
import { plural } from '../lib/share';
import GuessButtons from './GuessButtons';
import ArticleImage from './ArticleImage';
import BiasAxis from './BiasAxis';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; pool: PoolFile };

function pickRandom(pool: PoolFile): PoolItem | null {
  const played = new Set(loadPoolState().played);
  const unplayed = pool.items.filter((i) => !played.has(i.k));
  if (unplayed.length === 0) return null;
  return unplayed[Math.floor(Math.random() * unplayed.length)];
}

export default function InfinitePage() {
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [session, setSession] = useState({ plays: 0, wins: 0 });

  useEffect(() => {
    let cancelled = false;
    fetchPool()
      .then((pool) => {
        if (cancelled) return;
        setLoad({ kind: 'ready', pool });
        setCurrent(pickRandom(pool));
      })
      .catch(() => !cancelled && setLoad({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (load.kind === 'loading')
    return <p className="py-12 text-center text-sm text-stone-500">Wczytywanie…</p>;
  if (load.kind === 'error')
    return (
      <p className="py-12 text-center text-sm">
        Nie udało się wczytać nagłówków. Spróbuj odświeżyć stronę.
      </p>
    );

  const { pool } = load;
  const options = resolveOutlets(pool.options);

  if (current === null) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm">
          Rozegrałeś wszystkie dostępne nagłówki 🏁 Świeże wpadają codziennie.
        </p>
        <button
          type="button"
          onClick={() => {
            resetPoolPlayed();
            setGuess(null);
            setReveal(null);
            setCurrent(pickRandom(pool));
          }}
          className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Graj od nowa
        </button>
      </div>
    );
  }

  const onGuess = (i: number) => {
    if (guess !== null) return;
    let payload: RevealPayload;
    try {
      payload = deobfuscate<RevealPayload>(current.o, `pool:${current.k}`);
    } catch {
      // corrupted item — swap in another one
      recordPoolPlay(current.k, false);
      setCurrent(pickRandom(pool));
      return;
    }
    const correct = i === payload.a;
    recordPoolPlay(current.k, correct);
    setSession((s) => ({ plays: s.plays + 1, wins: s.wins + (correct ? 1 : 0) }));
    setGuess(i);
    setReveal(payload);
  };

  const onNext = () => {
    setGuess(null);
    setReveal(null);
    setCurrent(pickRandom(pool));
  };

  const correct = reveal !== null && guess === reveal.a;

  return (
    <div>
      <p className="text-center text-xs uppercase tracking-widest text-stone-500 dark:text-zinc-400">
        Bez limitu
        {session.plays > 0 && (
          <>
            {' '}
            · {session.wins}/{session.plays}{' '}
            {plural(session.plays, 'trafienie', 'trafienia', 'trafień')}
          </>
        )}
      </p>

      <figure className="my-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <blockquote className="text-balance font-serif text-2xl leading-snug">
          „{current.h}”
        </blockquote>
      </figure>

      <p className="mb-3 text-center text-sm font-medium">Kto to opublikował?</p>

      <GuessButtons
        options={options}
        answer={reveal?.a ?? null}
        guess={guess}
        onGuess={onGuess}
      />

      {reveal && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
          <p className="text-center text-lg font-bold">{correct ? 'Trafione! 🎯' : 'Pudło!'}</p>
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
          {reveal.img && (
            <ArticleImage
              src={reveal.img}
              href={reveal.url}
              alt={`Artykuł — ${options[reveal.a]?.name ?? ''}`}
            />
          )}
          {options[reveal.a] && guess !== null && options[guess] && (
            <BiasAxis answer={options[reveal.a]} guess={options[guess]} />
          )}
          <button
            type="button"
            onClick={onNext}
            autoFocus
            className="mt-4 w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Następny nagłówek →
          </button>
        </div>
      )}
    </div>
  );
}
