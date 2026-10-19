import { archiveEntries } from '../lib/collection';
import { loadResults } from '../lib/storage';
import { formatPolishDate } from '../lib/date';

export default function ArchivePage() {
  const results = loadResults();
  const months = [...new Set(archiveEntries.map((e) => e.date.slice(0, 7)))];

  return (
    <div>
      <h1 className="archive-heading">Archiwum zagadek</h1>
      <p className="archive-intro">{archiveEntries.length} zachowanych zagadek. Wybierz datę i zgadnij źródło nagłówka.
        Wyniki zostają w tej przeglądarce; nowe zagadki nie są już publikowane.</p>
      {months.map((month) => <section className="archive-month" key={month}>
        <h2>{new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`))}</h2>
        <ul>
        {archiveEntries.filter((e) => e.date.startsWith(month)).map((e) => {
          const r = results[e.date];
          const status = r ? (r.correct ? '🟩' : '🟥') : '·';
          return (
            <li key={e.date}>
              <a
                href={`#/d/${e.date}`}
              >
                <span className="text-sm">
                  <strong>#{e.id}</strong>
                  {formatPolishDate(e.date)}
                </span>
                <span aria-label={r ? (r.correct ? 'trafione' : 'pudło') : 'nierozwiązana'}>
                  {status}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      </section>)}
    </div>
  );
}
