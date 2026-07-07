import Modal from './Modal';
import { OUTLETS } from '../../config/outlets';

export default function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Jak grać?" onClose={onClose}>
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Pokazujemy <strong>prawdziwe nagłówki</strong> z polskich mediów — bez podpisu. Zgadnij,
          kto to opublikował:
        </p>
        <ul className="space-y-1.5">
          {OUTLETS.map((o) => (
            <li key={o.id} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: o.color }}
              />
              {o.name}
            </li>
          ))}
        </ul>
        <p>
          W przypadku Wykopu to tytuły znalezisk pisane przez użytkowników. Reszta — serio, tak
          piszą redakcje.
        </p>
        <p>
          <strong>∞ Bez limitu</strong> — losowe nagłówki z ostatnich dni, graj ile chcesz.
        </p>
        <p>
          <strong>📅 Codzienna</strong> — jedna wspólna zagadka dziennie: trafiaj dzień po dniu,
          żeby budować <strong>serię 🔥</strong>, porównaj się z innymi i pochwal wynikiem.
          Zagadki z archiwum nie liczą się do serii.
        </p>
        <p className="text-xs text-stone-500 dark:text-zinc-500">
          Po odpowiedzi zawsze pokazujemy źródło, zdjęcie z artykułu i link do oryginału.
        </p>
      </div>
    </Modal>
  );
}
