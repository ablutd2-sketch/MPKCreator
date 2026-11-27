import LineBadge from "@/components/LineBadge";
import { resolveAssignments } from "@/lib/simulation";
import { FLOOR_OPTIONS, floorMeta } from "@/lib/vehicleFloor";
import { cn } from "@/lib/utils";

const byNumber = (a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);

export default function LinesVehiclesGrid({ vehicles = [], lines = [], assignments = [] }) {
  const assigned = resolveAssignments({ vehicles, lines, assignments });
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const byLine = new Map();

  assigned.forEach((entry, vehicleId) => {
    const vehicle = vehicleById.get(vehicleId);
    if (!vehicle || !entry?.line) return;
    if (!byLine.has(entry.line.id)) byLine.set(entry.line.id, []);
    byLine.get(entry.line.id).push({ vehicle, brigade: entry.assignment?.brigade || "" });
  });

  const ordered = lines.filter((line) => byLine.has(line.id)).sort(byNumber);
  if (!ordered.length) {
    return (
      <div className="surface px-4 py-6 text-center text-[12.5px] text-muted-foreground">
        Przypisz pojazdy do brygad, aby zobaczyć je na liniach.
      </div>
    );
  }

  const total = ordered.reduce((sum, line) => sum + byLine.get(line.id).length, 0);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <p className="eyebrow">Pojazdy na liniach</p>
          <h2 className="mt-1 font-display text-xl leading-none">Kto jeździ na której linii</h2>
        </div>
        <span className="num text-[11px] text-muted-foreground">
          {total} pojazdów · {ordered.length} linii
        </span>
      </div>

      <div className="overflow-x-auto px-3 py-3">
        <div className="flex gap-2">
          {ordered.map((line) => (
            <div
              key={line.id}
              className="w-[112px] shrink-0 rounded-lg border border-border/70 bg-secondary/30 p-1.5"
            >
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <LineBadge line={line} size="sm" />
                <span className="num text-[9.5px] text-muted-foreground">{byLine.get(line.id).length}</span>
              </div>
              <ul className="space-y-1">
                {byLine
                  .get(line.id)
                  .sort((a, b) => String(a.vehicle.fleet_number).localeCompare(String(b.vehicle.fleet_number)))
                  .map(({ vehicle, brigade }) => {
                    const meta = floorMeta(vehicle.floor);
                    return (
                      <li
                        key={vehicle.id}
                        title={`${vehicle.fleet_number} · ${vehicle.model || "bez modelu"} · ${meta.label}${brigade ? ` · ${brigade}` : ""}`}
                        className={cn(
                          "truncate rounded border px-1 py-0.5 font-mono text-[10.5px] font-semibold",
                          meta.chip
                        )}
                      >
                        {vehicle.fleet_number}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/70 px-4 py-2">
        <span className="eyebrow">Legenda</span>
        {FLOOR_OPTIONS.map((option) => (
          <span key={option.value} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-sm border", option.chip)} />
            {option.short}
          </span>
        ))}
      </div>
    </div>
  );
}
