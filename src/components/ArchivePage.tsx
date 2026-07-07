import { useEffect, useState } from 'react';
import { fetchIndex, type IndexEntry } from '../lib/puzzles';
import { loadResults } from '../lib/storage';
import { warsawDateKey, formatPolishDate } from '../lib/date';

export default function ArchivePage() {
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchIndex()
      .then((i) => setIndex(i.sort((a, b) => b.date.localeCompare(a.date))))
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-center text-sm">Nie udało się wczytać archiwum.</p>;
  if (!index) return <p className="text-center text-sm text-stone-500">Wczytywanie…</p>;

  const results = loadResults();
  const today = warsawDateKey();
  const visible = index.filter((e) => e.date <= today);

  return (
    <div>
      <h1 className="mb-4 font-serif text-lg font-bold">Archiwum</h1>
      <ul className="space-y-1.5">
        {visible.map((e) => {
          const r = results[e.date];
          const status = r ? (r.correct ? '🟩' : '🟥') : '·';
          return (
            <li key={e.date}>
              <a
                href={`#/d/${e.date}`}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm hover:shadow dark:bg-zinc-900"
              >
                <span className="text-sm">
                  <span className="font-bold tabular-nums">#{e.id}</span>
                  <span className="mx-2 text-stone-400 dark:text-zinc-600">·</span>
                  {formatPolishDate(e.date)}
                  {e.date === today && (
                    <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                      dziś
                    </span>
                  )}
                </span>
                <span aria-label={r ? (r.correct ? 'trafione' : 'pudło') : 'nierozwiązana'}>
                  {status}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
