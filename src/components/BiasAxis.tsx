import type { Outlet } from '../../config/outlets';

interface Props {
  answer: Outlet;
  guess: Outlet;
}

/** Clamp to the track and keep markers off the very edges. */
const pos = (bias: number) => `${4 + ((Math.max(-1, Math.min(1, bias)) + 1) / 2) * 92}%`;

/**
 * The reveal-panel spectrum: where the real publisher sits on the (admittedly
 * reductive) lewica↔prawica axis vs where the player's guess sits.
 */
export default function BiasAxis({ answer, guess }: Props) {
  const same = answer.id === guess.id;
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400">
        Oś mediów <span className="normal-case">(umowna)</span>
      </p>
      <div className="relative h-14">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-stone-200 dark:bg-zinc-800" />
        <div className="absolute top-1/2 left-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-stone-300 dark:bg-zinc-700" />
        <span
          className="absolute top-0 -translate-x-1/2 text-sm"
          style={{ left: pos(guess.bias) }}
          title={`Twoja odpowiedź: ${guess.name}`}
          aria-label={`Twoja odpowiedź: ${guess.name}`}
        >
          👤
        </span>
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-zinc-900"
          style={{ left: pos(answer.bias), backgroundColor: answer.color }}
          title={answer.name}
        />
        <span
          className="absolute bottom-0 -translate-x-1/2 text-xs text-stone-600 dark:text-zinc-300"
          style={{ left: pos(answer.bias) }}
        >
          {answer.short}
        </span>
        {!same && (
          <span
            className="absolute bottom-0 -translate-x-1/2 text-xs text-stone-400 dark:text-zinc-500"
            style={{ left: pos(guess.bias) }}
          >
            {guess.short}
          </span>
        )}
      </div>
      <div className="flex justify-between text-xs text-stone-500 dark:text-zinc-500">
        <span>← lewica</span>
        <span>prawica →</span>
      </div>
    </div>
  );
}
