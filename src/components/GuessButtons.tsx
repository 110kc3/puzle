import { useEffect } from 'react';
import type { Outlet } from '../../config/outlets';

interface Props {
  options: Outlet[];
  /** Correct answer index — null until revealed. */
  answer: number | null;
  /** Player's guess index — null until guessed. */
  guess: number | null;
  onGuess: (i: number) => void;
}

export default function GuessButtons({ options, answer, guess, onGuess }: Props) {
  const done = guess !== null;

  // Keyboard shortcuts 1–N.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) onGuess(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGuess, options.length]);

  return (
    <div className="space-y-2">
      {options.map((o, i) => {
        const isAnswer = answer !== null && i === answer;
        const isMine = guess !== null && i === guess;
        let cls =
          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ';
        if (!done) {
          cls +=
            'border-stone-300 bg-white hover:-translate-y-0.5 hover:shadow dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800';
        } else if (isAnswer) {
          cls +=
            'border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200';
        } else if (isMine) {
          cls += 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200';
        } else {
          cls += 'border-stone-200 bg-white opacity-45 dark:border-zinc-800 dark:bg-zinc-900';
        }
        return (
          <button key={o.id} type="button" onClick={() => onGuess(i)} disabled={done} className={cls}>
            <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
            <span className="flex-1">{o.name}</span>
            {!done && (
              <kbd className="hidden rounded border border-stone-300 px-1.5 text-xs text-stone-400 sm:inline dark:border-zinc-700 dark:text-zinc-500">
                {i + 1}
              </kbd>
            )}
            {isAnswer && <span aria-hidden>✓</span>}
            {isMine && !isAnswer && <span aria-hidden>✗</span>}
          </button>
        );
      })}
    </div>
  );
}
