import index from '../../public/puzzles/index.json';

/** The frozen collection. No clock or publication service is needed to play. */
export const archiveEntries = [...index].sort((a, b) => b.date.localeCompare(a.date));
export const latestDate = archiveEntries[0].date;
export const firstDate = archiveEntries[archiveEntries.length - 1].date;
