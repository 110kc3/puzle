import { OUTLETS } from '../../config/outlets';
import { archiveEntries, firstDate, latestDate } from '../lib/collection';
import { formatPolishDate } from '../lib/date';

export default function ShowcasePage() {
  return (
    <div className="showcase">
      <section className="cover" aria-labelledby="cover-title">
        <div className="edition-line"><span>Eksperyment z językiem mediów</span><span>Projekt archiwalny · 2026</span></div>
        <p className="eyebrow">Sześć źródeł. Jeden nagłówek.</p>
        <h1 id="cover-title">Rozpoznasz<br />media <em>po słowach?</em></h1>
        <p className="cover-intro">Usuń logo, zostaw nagłówek. Czy nadal wiesz, kto go napisał?
          Mała gra o wielkich różnicach w języku polskich mediów.</p>
        <div className="cover-actions">
          <a className="primary-link" href="#/gra">Zagraj w demo <span aria-hidden="true">↗</span></a>
          <a className="text-link" href="#/archiwum">Przeglądaj archiwum <span aria-hidden="true">→</span></a>
        </div>
        <div className="outlet-strip" aria-label="Źródła nagłówków">
          {OUTLETS.map((o) => <span key={o.id}><i style={{ backgroundColor: o.color }} aria-hidden="true" />{o.short}</span>)}
        </div>
      </section>
      <section className="project-spread" aria-labelledby="idea-title">
        <div className="spread-label"><span className="eyebrow">01 / Pomysł</span><span className="large-mark" aria-hidden="true">„</span></div>
        <div>
          <h2 id="idea-title">Ta sama rzeczywistość.<br />Różne nagłówki.</h2>
          <p>Quiz inspirowany codziennym rytuałem Wordle. Zamiast zgadywać słowo,
            przypisujesz prawdziwy nagłówek do źródła: od Gazety Wyborczej po Wykop.
            Po odpowiedzi odkrywasz autora i link do oryginalnego artykułu.</p>
          <p>To zabawa w rozpoznawanie stylu, nie test poglądów. Pozycje na osi mediów
            są umowną interpretacją; tytuły znalezisk na Wykopie pochodzą od użytkowników.</p>
        </div>
      </section>
      <section className="collection-card" aria-labelledby="collection-title">
        <div><p className="eyebrow">Zachowane do gry</p><h2 id="collection-title">Małe archiwum.<br />Dużo do odgadnięcia.</h2>
          <p>Zbiór pozostaje dostępny jako interaktywne portfolio. Publikacja nowych
            zagadek jest zakończona — możesz grać we własnym tempie, bez konta.</p>
          <a className="text-link" href={`#/d/${latestDate}`}>Ostatnia opublikowana zagadka <span aria-hidden="true">→</span></a>
        </div>
        <dl className="collection-numbers">
          <div><dt>Zagadek w archiwum</dt><dd>{archiveEntries.length}</dd></div>
          <div><dt>Źródeł nagłówków</dt><dd>{OUTLETS.length}</dd></div>
        </dl>
        <p className="collection-dates">Publikacje: {formatPolishDate(firstDate)} — {formatPolishDate(latestDate)}</p>
      </section>
      <section className="project-spread" aria-labelledby="build-title">
        <div className="spread-label"><span className="eyebrow">02 / Od pomysłu do gry</span></div>
        <div><h2 id="build-title">Prosta na zewnątrz.<br />Przemyślana w środku.</h2>
          <div className="project-details">
            <div><h3>Interakcja</h3><p>Dwa sposoby gry: losowanie z zapisanej puli i wybór zagadki z archiwum. Odpowiedzi, historia wyników i obsługa klawiatury.</p></div>
            <div><h3>Dane</h3><p>Własny pipeline RSS i scraperów HTML, ręczna selekcja codziennych zagadek oraz odpowiedzi ukryte przed przypadkowym podejrzeniem.</p></div>
            <div><h3>Technologia</h3><p>React, TypeScript, Vite i Tailwind CSS. Statyczna strona na GitHub Pages, wyniki zapisane lokalnie w przeglądarce.</p></div>
          </div>
          <a className="text-link" href="https://github.com/110kc3/puzle">Zobacz kod na GitHubie <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </div>
  );
}
