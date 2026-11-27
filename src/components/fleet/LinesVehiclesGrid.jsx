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
}import { useEffect, useMemo, useState } from "react";
import { computeFleetState, resolveAssignments } from "@/lib/simulation";
import { useSimulation } from "@/lib/SimulationContext";
import { FLOOR_OPTIONS, floorMeta } from "@/lib/vehicleFloor";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "krakbus-favorites";

const byNumber = (a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);

const BARS = [
  { key: "hunger", label: "Głód", color: "#c62828" },
  { key: "satisfaction", label: "Zad.", color: "#2e7d32" },
  { key: "fatigue", label: "Zmę.", color: "#ef6c00" },
  { key: "thirst", label: "Prag.", color: "#1565c0" },
];

function MiniBars({ stat }) {
  return (
    <div className="mt-1 space-y-[3px]">
      {BARS.map((bar) => {
        const value = Math.max(0, Math.min(100, Math.round(Number(stat?.[bar.key]) || 0)));
        return (
          <div key={bar.key} className="flex items-center gap-1" title={`${bar.label} ${value}%`}>
            <span className="w-[22px] shrink-0 text-[7px] leading-none text-black/70">{bar.label}</span>
            <span className="h-[4px] flex-1 border border-black/30 bg-white/60">
              <span className="block h-full" style={{ width: `${value}%`, background: bar.color }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-black">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-3.5 w-3.5 accent-black" />
      {children}
    </label>
  );
}

export default function LinesVehiclesGrid({ vehicles = [], lines = [], assignments = [] }) {
  const sim = useSimulation();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const [colorByFloor, setColorByFloor] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
    } catch {
      setFavorites([]);
    }
  }, []);

  const stats = useMemo(() => {
    const map = new Map();
    computeFleetState({
      vehicles,
      lines,
      assignments,
      simMinutes: sim.simMinutes,
      dayKey: sim.dayKey,
    }).forEach((item) => map.set(item.vehicle.id, item));
    return map;
  }, [vehicles, lines, assignments, sim.simMinutes, sim.dayKey]);

  const assigned = useMemo(() => resolveAssignments({ vehicles, lines, assignments }), [vehicles, lines, assignments]);
  const vehicleById = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles]);

  const byLine = new Map();
  assigned.forEach((entry, vehicleId) => {
    const vehicle = vehicleById.get(vehicleId);
    if (!vehicle || !entry?.line) return;
    const stat = stats.get(vehicleId);
    if (onlyActive && !stat?.state) return;
    if (onlyFavorites && !favorites.includes(vehicleId)) return;
    if (!byLine.has(entry.line.id)) byLine.set(entry.line.id, []);
    byLine.get(entry.line.id).push({ vehicle, stat });
  });

  const ordered = lines.filter((line) => byLine.has(line.id)).sort(byNumber);
  const total = ordered.reduce((sum, line) => sum + byLine.get(line.id).length, 0);

  return (
    <div className="text-black">
      <div className="space-y-1">
        <Check checked={onlyFavorites} onChange={setOnlyFavorites}>
          Wyświetl tylko ulubione
        </Check>
        <Check checked={onlyActive} onChange={setOnlyActive}>
          Wyświetl tylko aktualne
        </Check>
        <Check checked={colorByFloor} onChange={setColorByFloor}>
          Koloruj według podłogi
        </Check>
      </div>

      <p className="mt-2 text-[12px] text-black/60">
        Ostatnia aktualizacja: teraz · {total} pojazdów · {ordered.length} linii
      </p>

      <div className="mt-3 overflow-x-auto border border-[#E0E0E0] bg-white p-2">
        {ordered.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-black/60">Brak pojazdów do pokazania.</p>
        ) : (
          <div className="flex items-start gap-2">
            {ordered.map((line) => (
              <div key={line.id} className="w-[120px] shrink-0">
                <div className="border border-black bg-white py-0.5 text-center text-[13px] font-bold leading-tight">
                  {line.number}
                </div>
                <div className="space-y-[3px] pt-[3px]">
                  {byLine
                    .get(line.id)
                    .sort((a, b) => String(a.vehicle.fleet_number).localeCompare(String(b.vehicle.fleet_number)))
                    .map(({ vehicle, stat }) => {
                      const meta = floorMeta(vehicle.floor);
                      return (
                        <div
                          key={vehicle.id}
                          title={`${vehicle.fleet_number} · ${vehicle.model || "bez modelu"} · ${meta.label}`}
                          className={cn("border border-black/70 px-1 py-1", colorByFloor ? meta.chip : "bg-white")}
                        >
                          <span className="block truncate font-mono text-[11px] font-bold leading-none">
                            {vehicle.fleet_number}
                          </span>
                          <MiniBars stat={stat} />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setLegendOpen((value) => !value)}
          className="flex items-center gap-1 text-[13px] font-semibold text-black"
        >
          <span className="text-[10px]">{legendOpen ? "▼" : "▶"}</span>
          Legenda
        </button>
        {legendOpen && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {FLOOR_OPTIONS.map((option) => (
              <span key={option.value} className="flex items-center gap-1.5 text-[12px] text-black/80">
                <span className={cn("h-4 w-6 border border-black/40", option.dot)} />
                {option.short}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
