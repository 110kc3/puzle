import { useEffect, useState } from 'react';
import PuzzlePage from './components/PuzzlePage';
import InfinitePage from './components/InfinitePage';
import ArchivePage from './components/ArchivePage';
import HelpModal from './components/HelpModal';
import StatsModal from './components/StatsModal';
import { loadResults } from './lib/storage';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  // First visit (no results yet) → open the how-to-play modal.
  const [showHelp, setShowHelp] = useState(() => Object.keys(loadResults()).length === 0);
  const [showStats, setShowStats] = useState(false);

  const dayMatch = hash.match(/^#\/d\/(\d{4}-\d{2}-\d{2})$/);
  let view: React.ReactNode;
  let tab: 'endless' | 'daily' | null = null;
  if (hash === '#/archiwum') view = <ArchivePage />;
  else if (dayMatch) view = <PuzzlePage key={dayMatch[1]} archiveDate={dayMatch[1]} />;
  else if (hash === '#/dzienna') {
    view = <PuzzlePage key="today" />;
    tab = 'daily';
  } else {
    view = <InfinitePage />;
    tab = 'endless';
  }

  const tabCls = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
        : 'bg-white text-stone-600 hover:bg-stone-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
    }`;

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
        <header className="flex items-center justify-between gap-2 border-b border-stone-300 py-3 dark:border-zinc-800">
          <a href="#/" className="font-serif text-xl font-bold tracking-tight">
            Wykop <span className="font-normal text-stone-400 dark:text-zinc-500">czy</span>{' '}
            Wyborcza?
          </a>
          <nav className="flex items-center gap-1">
            <a
              href="#/archiwum"
              aria-label="Archiwum"
              title="Archiwum"
              className="rounded-lg p-2 text-lg leading-none hover:bg-stone-200 dark:hover:bg-zinc-800"
            >
              🗓️
            </a>
            <button
              type="button"
              aria-label="Statystyki"
              title="Statystyki"
              onClick={() => setShowStats(true)}
              className="rounded-lg p-2 text-lg leading-none hover:bg-stone-200 dark:hover:bg-zinc-800"
            >
              📊
            </button>
            <button
              type="button"
              aria-label="Jak grać"
              title="Jak grać"
              onClick={() => setShowHelp(true)}
              className="rounded-lg p-2 text-lg leading-none hover:bg-stone-200 dark:hover:bg-zinc-800"
            >
              ❓
            </button>
          </nav>
        </header>

        <main className="flex-1 py-6">
          {tab !== null && (
            <nav className="mb-6 flex justify-center gap-2" aria-label="Tryb gry">
              <a href="#/" className={tabCls(tab === 'endless')}>
                ∞ Bez limitu
              </a>
              <a href="#/dzienna" className={tabCls(tab === 'daily')}>
                📅 Codzienna
              </a>
            </nav>
          )}
          {view}
        </main>

        <footer className="border-t border-stone-300 py-3 text-center text-xs text-stone-500 dark:border-zinc-800 dark:text-zinc-500">
          Nagłówki cytowane z podaniem źródła i linkiem ·{' '}
          <a
            href="https://github.com/110kc3/puzle"
            className="underline decoration-dotted underline-offset-2"
          >
            kod
          </a>
        </footer>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  );
}
