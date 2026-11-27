import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import LineBadge from "@/components/LineBadge";
import { ASSIGNMENT_MODE_LABELS } from "@/lib/lineUtils";
import { cn } from "@/lib/utils";

export default function LinesPanel({ lines, selectedId, onSelect, onCreate, onDelete }) {
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!number.trim()) return;
    setBusy(true);
    try {
      await onCreate({ number: number.trim() });
      setNumber("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <p className="eyebrow">Nowa linia</p>
        <form onSubmit={submit} className="mt-2 space-y-2">
          <Input
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="Numer linii, np. 101"
            aria-label="Numer nowej linii"
            className="h-9 font-mono text-[12px]"
          />
          <button
            type="submit"
            disabled={busy || !number.trim()}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-[12px] font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Utwórz linię
          </button>
        </form>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          Po utworzeniu klikaj przystanki na mapie: początek, pośrednie i koniec trasy.
        </p>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-border/70 px-4 py-2.5">
          <p className="eyebrow">Linie</p>
        </div>
        {lines.length === 0 ? (
          <p className="px-4 py-5 text-[12px] text-muted-foreground">Brak linii. Utwórz pierwszą powyżej.</p>
        ) : (
          <ul>
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-2 border-b border-border/50 px-2 py-1.5 last:border-0">
                <button
                  type="button"
                  onClick={() => onSelect(line.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                    selectedId === line.id ? "bg-secondary" : "hover:bg-secondary/60"
                  )}
                >
                  <LineBadge line={line} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">
                      {line.name || `Linia ${line.number}`}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {(line.stops || []).length} przystanków ·{" "}
                      {ASSIGNMENT_MODE_LABELS[line.assignment_mode || "manual"]}
                      {line.night ? " · nocna" : ""}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Usuń linię"
                  onClick={() => onDelete(line)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
