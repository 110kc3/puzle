import { useEffect, useState } from 'react';
import PuzzlePage from './components/PuzzlePage';
import InfinitePage from './components/InfinitePage';
import ArchivePage from './components/ArchivePage';
import ShowcasePage from './components/ShowcasePage';
import HelpModal from './components/HelpModal';
import StatsModal from './components/StatsModal';
import { latestDate } from './lib/collection';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const dayMatch = hash.match(/^#\/d\/(\d{4}-\d{2}-\d{2})$/);
  const isGame = hash === '#/gra';
  const isArchive = hash === '#/archiwum' || !!dayMatch || hash === '#/dzienna';
  const isHome = !isGame && !isArchive;

  let view: React.ReactNode = <ShowcasePage />;
  if (hash === '#/archiwum') view = <ArchivePage />;
  else if (dayMatch) view = <PuzzlePage key={dayMatch[1]} archiveDate={dayMatch[1]} />;
  // Preserve old daily links without requesting a nonexistent puzzle for today.
  else if (hash === '#/dzienna') view = <PuzzlePage key={latestDate} archiveDate={latestDate} />;
  else if (isGame) view = <InfinitePage />;

  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link" onClick={(e) => {
        e.preventDefault(); document.getElementById('main-content')?.focus();
      }}>Przejdź do treści</a>
      <header className="site-header">
        <a href="#/" className="wordmark" aria-label="Wykop czy Wyborcza? — o projekcie">Wykop <em>czy</em> Wyborcza<span>?</span></a>
        <nav className="site-nav" aria-label="Nawigacja główna">
          <a href="#/" aria-current={isHome ? 'page' : undefined}>Projekt</a>
          <a href="#/gra" aria-current={isGame ? 'page' : undefined}>Graj</a>
          <a href="#/archiwum" aria-current={isArchive ? 'page' : undefined}>Archiwum</a>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className={isHome ? 'home-content' : 'game-content'}>
        {!isHome && <div className="game-toolbar"><span>Archiwalna kolekcja · bez nowych publikacji</span><div>
          <button type="button" onClick={() => setShowStats(true)}>Wyniki</button>
          <button type="button" onClick={() => setShowHelp(true)}>Jak grać?</button>
        </div></div>}
        {view}
      </main>
      <footer className="site-footer"><span>Wykop czy Wyborcza? <span className="footer-date">/ 2026</span></span>
        <p>Projekt archiwalny. Nagłówki z podaniem źródła i linkiem.</p>
        <a href="https://github.com/110kc3/puzle">GitHub ↗</a>
      </footer>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  );
}
