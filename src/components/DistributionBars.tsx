import type { Outlet } from '../../config/outlets';
import { plural } from '../lib/share';

interface Props {
  counts: number[];
  answer: number;
  mine: number;
  options: Outlet[];
}

export default function DistributionBars({ counts, answer, mine, options }: Props) {
  const total = options.reduce((sum, _, i) => sum + (counts[i] ?? 0), 0);
  if (total === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400">
        Tak odpowiadali inni ({total} {plural(total, 'głos', 'głosy', 'głosów')})
      </p>
      <div className="space-y-1.5">
        {options.map((o, i) => {
          const pct = Math.round(((counts[i] ?? 0) / total) * 100);
          const isAnswer = i === answer;
          return (
            <div key={o.id} className="flex items-center gap-2 text-sm">
              <span
                className={`w-24 shrink-0 truncate ${isAnswer ? 'font-bold' : ''}`}
                title={o.name}
              >
                {o.short}
                {i === mine ? ' 👤' : ''}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-stone-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isAnswer ? '#16a34a' : o.color,
                    opacity: isAnswer ? 1 : 0.45,
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
