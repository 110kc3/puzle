export type OutletId = 'wyborcza' | 'wykop' | 'republika' | 'fakt' | 'zero' | 'onet';

export interface Outlet {
  id: OutletId;
  /** Full name shown on the answer buttons. */
  name: string;
  /** Short name for compact UI (bars, archive). */
  short: string;
  /** Approximate brand accent color. */
  color: string;
  homepage: string;
  /**
   * Lower-cased fragments that give the source away — gathered candidates
   * containing any of them are dropped.
   */
  selfNames: string[];
  /**
   * Position on the (admittedly reductive) lewica↔prawica axis, −1…+1.
   * An editorial judgment call, used only for the reveal-panel spectrum —
   * for Wykop/Zero/Fakt it reads more as "establishment↔internet/tabloid".
   */
  bias: number;
}

/**
 * The fixed cast. Answer buttons always show these four, in this order —
 * the answer index in a puzzle's reveal blob refers to this array.
 */
export const OUTLETS: Outlet[] = [
  {
    id: 'wyborcza',
    name: 'Gazeta Wyborcza',
    short: 'Wyborcza',
    color: '#9a1b28',
    homepage: 'https://wyborcza.pl',
    selfNames: ['wyborcza', 'gazeta.pl', 'wysokie obcasy'],
    bias: -0.7,
  },
  {
    id: 'wykop',
    name: 'Wykop',
    short: 'Wykop',
    color: '#3f8ac2',
    homepage: 'https://wykop.pl',
    selfNames: ['wykop', 'mikroblog', 'znalezisk'],
    bias: 0.2,
  },
  {
    id: 'republika',
    name: 'TV Republika',
    short: 'Republika',
    color: '#1c2e5e',
    homepage: 'https://tvrepublika.pl',
    selfNames: ['republika', 'republiki'],
    bias: 0.9,
  },
  {
    id: 'fakt',
    name: 'Fakt',
    short: 'Fakt',
    color: '#e4032e',
    homepage: 'https://www.fakt.pl',
    selfNames: ['fakt.pl', 'fakt24', '- fakt', '[fakt', 'faktu:'],
    bias: -0.1,
  },
  {
    id: 'zero',
    name: 'Zero.pl',
    short: 'Zero',
    color: '#b8cf2e',
    homepage: 'https://zero.pl',
    selfNames: ['zero.pl', 'kanał zero', 'kanal zero', 'stanowski'],
    bias: 0.4,
  },
  {
    id: 'onet',
    name: 'Onet',
    short: 'Onet',
    color: '#ff6200',
    homepage: 'https://wiadomosci.onet.pl',
    selfNames: ['onet'],
    bias: -0.4,
  },
];

export function outletIndex(id: OutletId): number {
  return OUTLETS.findIndex((o) => o.id === id);
}

/**
 * Maps a puzzle's stored option names back to outlet configs, so puzzles
 * published under an older/smaller cast keep rendering correctly.
 */
export function resolveOutlets(names: string[]): Outlet[] {
  return names.map(
    (name) =>
      OUTLETS.find((o) => o.name === name) ?? {
        id: name as OutletId,
        name,
        short: name,
        color: '#888888',
        homepage: '',
        selfNames: [],
        bias: 0,
      },
  );
}
