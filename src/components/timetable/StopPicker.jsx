import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function StopPicker({ stops = [], query, onQueryChange, selectedKey, onSelect }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Szukaj przystanku"
            aria-label="Szukaj przystanku"
            className="h-8 pl-8 text-[12px]"
          />
        </div>
      </div>

      <ul className="max-h-[540px] overflow-y-auto">
        {stops.map((stop) => (
          <li key={stop.key}>
            <button
              type="button"
              onClick={() => onSelect(stop.key)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/70",
                stop.key === selectedKey && "bg-secondary"
              )}
            >
              <span className="min-w-0 truncate text-[12.5px] text-foreground">{stop.name}</span>
              <span className="num shrink-0 text-[10px] text-muted-foreground">{stop.lines.length}</span>
            </button>
          </li>
        ))}
        {stops.length === 0 && (
          <li className="px-3 py-4 text-[11.5px] text-muted-foreground">Brak przystanków dla tego wyszukiwania.</li>
        )}
      </ul>
    </div>
  );
}
