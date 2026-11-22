import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const chipClass = (active) =>
  cn(
    "flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:text-foreground"
  );

export default function FleetFilters({
  query,
  onQueryChange,
  onlyActive,
  onToggleActive,
  onlyFavorites,
  onToggleFavorites,
  activeCount,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Szukaj po numerze taborowym lub linii"
          className="h-10 rounded-full bg-card pl-10 text-[13px]"
        />
      </div>

      <button type="button" onClick={onToggleActive} className={chipClass(onlyActive)}>
        Tylko aktywne{activeCount ? ` (${activeCount})` : ""}
      </button>

      <button type="button" onClick={onToggleFavorites} className={chipClass(onlyFavorites)}>
        <Star className={cn("h-3.5 w-3.5", onlyFavorites && "fill-current")} />
        Ulubione
      </button>
    </div>
  );
}
