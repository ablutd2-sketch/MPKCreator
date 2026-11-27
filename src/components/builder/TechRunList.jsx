import { Route, Trash2 } from "lucide-react";

export default function TechRunList({ runs, onOpen, onDelete }) {
  return (
    <div className="surface p-3">
      <p className="eyebrow">Zapisane przejazdy</p>
      {!runs.length ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Brak przejazdów technicznych. Zaznacz obszar, wskaż początek i koniec, a potem wyznacz trasę po drogach.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {runs.map((run) => (
            <li key={run.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpen(run)}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-left text-[11.5px] font-medium text-foreground transition-colors hover:border-primary"
              >
                <Route className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{run.name}</span>
                <span className="num shrink-0 text-[10.5px] text-muted-foreground">
                  {Number(run.distance_km || 0).toFixed(1)} km
                </span>
              </button>
              <button
                type="button"
                aria-label="Usuń przejazd"
                onClick={() => onDelete(run)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
