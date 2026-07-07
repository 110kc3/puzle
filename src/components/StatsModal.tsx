import Modal from './Modal';
import { loadResults, loadPoolState } from '../lib/storage';
import { currentStreak, bestStreak } from '../lib/streak';
import { warsawDateKey } from '../lib/date';

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-stone-100 p-3 text-center dark:bg-zinc-800">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

export default function StatsModal({ onClose }: { onClose: () => void }) {
  const results = loadResults();
  const entries = Object.values(results);
  const played = entries.length;
  const wins = entries.filter((r) => r.correct).length;
  const pct = played === 0 ? 0 : Math.round((wins / played) * 100);
  const today = warsawDateKey();
  const pool = loadPoolState();
  const poolPct = pool.plays === 0 ? 0 : Math.round((pool.wins / pool.plays) * 100);

  return (
    <Modal title="Statystyki" onClose={onClose}>
      <p className="mb-2 text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400">
        📅 Codzienna
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stat value={played} label="zagrane" />
        <Stat value={`${pct}%`} label="skuteczność" />
        <Stat value={currentStreak(results, today)} label="aktualna seria" />
        <Stat value={bestStreak(results)} label="najlepsza seria" />
      </div>
      <p className="mt-4 mb-2 text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400">
        ∞ Bez limitu
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stat value={pool.plays} label="zagrane" />
        <Stat value={`${poolPct}%`} label="skuteczność" />
      </div>
      <p className="mt-3 text-xs text-stone-500 dark:text-zinc-500">
        Seria liczy się tylko za codzienne zagadki rozwiązane w dniu publikacji. Wyniki trzymamy
        wyłącznie w tej przeglądarce.
      </p>
    </Modal>
  );
}
