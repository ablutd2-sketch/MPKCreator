import { ArrowDown, ArrowUp, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_STYLES = {
  start: "bg-emerald-500/15 text-emerald-700",
  mid: "bg-secondary text-muted-foreground",
  end: "bg-primary/10 text-primary",
};

export default function StopRow({
  stop,
  index,
  total,
  selected,
  placingBack,
  onSelect,
  onChange,
  onRemove,
  onMove,
  onPlaceBack,
  onAddVia,
}) {
  const role = index === 0 ? "start" : index === total - 1 ? "end" : "mid";
  const roleLabel = role === "start" ? "Początek" : role === "end" ? "Koniec" : "Pośredni";

  return (
    <li className={cn("border-b border-border/50 last:border-0", selected && "bg-secondary/40")}>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={onSelect}
          className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground"
          aria-label={`Przystanek ${index + 1}`}
        >
          {index + 1}
        </button>
        <input
          value={stop.name || ""}
          onChange={(event) => onChange({ name: event.target.value })}
          onFocus={onSelect}
          placeholder="Nazwa przystanku"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[11.5px] outline-none focus:border-border focus:bg-card"
        />
        <input
          value={stop.pole || "01"}
          onChange={(event) => onChange({ pole: event.target.value.slice(0, 4) })}
          onFocus={onSelect}
          aria-label="Numer słupka TAM"
          title="Słupek TAM"
          className="num w-9 shrink-0 rounded-md border border-border bg-card px-1 py-0.5 text-center text-[10px]"
        />
        {stop.petla && (
          <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-amber-700">
            Pętla
          </span>
        )}
        <button
          type="button"
          aria-label="W górę"
          onClick={() => onMove(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="W dół"
          onClick={() => onMove(1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Usuń" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {selected && (
        <div className="space-y-2 border-t border-border/50 px-2 py-2">
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.12em]", ROLE_STYLES[role])}>
              {roleLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">Słupek POWRÓT</span>
            <input
              value={stop.pole_back || "02"}
              onChange={(event) => onChange({ pole_back: event.target.value.slice(0, 4) })}
              aria-label="Numer słupka POWRÓT"
              className="num w-9 rounded-md border border-border bg-card px-1 py-0.5 text-center text-[10px]"
            />
            <button
              type="button"
              onClick={onPlaceBack}
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-semibold transition-colors",
                placingBack
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary"
              )}
            >
              <MapPin className="h-3 w-3" />
              {placingBack ? "Kliknij mapę" : "Ustaw na mapie"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onChange({ petla: !stop.petla })}
            className={cn(
              "w-full rounded-md border px-1.5 py-1 text-[10px] font-semibold transition-colors",
              stop.petla
                ? "border-amber-500 bg-amber-500 text-white"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {stop.petla ? "Pętla — dłuższy postój" : "Oznacz jako pętlę"}
          </button>
          <button
            type="button"
            onClick={onAddVia}
            className="w-full rounded-md border border-border bg-card px-1.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Dodaj jako punkt pętli
          </button>
          <p className="num text-[9.5px] leading-relaxed text-muted-foreground">
            TAM {Number(stop.lat).toFixed(5)}, {Number(stop.lng).toFixed(5)} · POWRÓT{" "}
            {Number(stop.lat_back ?? stop.lat).toFixed(5)}, {Number(stop.lng_back ?? stop.lng).toFixed(5)}
          </p>
        </div>
      )}
    </li>
  );
}
