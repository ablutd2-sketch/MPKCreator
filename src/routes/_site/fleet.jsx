import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FleetFilters from "@/components/fleet/FleetFilters";
import FleetTable from "@/components/fleet/FleetTable";
import { useSimulation } from "@/lib/SimulationContext";
import { computeFleetState, lastActivity, nextDepartureAcross } from "@/lib/simulation";
import { wakeFatigueValue } from "@/lib/fatigue";
import { useTransitData } from "@/lib/useTransitData";

export const Route = createFileRoute("/_site/fleet")({
  head: () => ({
    meta: [
      { title: "Tabor / Pojazdy · BusTracker PL" },
      {
        name: "description",
        content: "Wykaz całej floty: pojazdy, aktualne linie, kierunki, brygady i czas ostatniej aktywności.",
      },
    ],
  }),
  component: FleetPage,
});

const FAVORITES_KEY = "krakbus-favorites";

function FleetPage() {
  const { vehicles, lines, assignments, loading, reload } = useTransitData();
  const sim = useSimulation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [now, setNow] = useState(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    lastUpdate.current = Date.now();
  }, [sim.simMinutes]);

  const rows = useMemo(() => {
    const fleet = computeFleetState({
      vehicles,
      lines,
      assignments,
      simMinutes: sim.simMinutes,
      dayKey: sim.dayKey,
    });

    return fleet.map((item) => ({
      ...item,
      activity: item.state
        ? null
        : lastActivity({
            assignment: item.assignment,
            line: item.line,
            dayKey: sim.dayKey,
            simMinutes: sim.simMinutes,
          }),
    }));
  }, [vehicles, lines, assignments, sim.simMinutes, sim.dayKey]);

  const activeCount = rows.filter((row) => row.state).length;
  const secondsAgo = now ? Math.max(1, Math.round((now - lastUpdate.current) / 1000)) : 1;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (onlyActive && !row.state) return false;
      if (onlyFavorites && !favorites.includes(row.vehicle.id)) return false;
      if (!needle) return true;
      const fleetNumber = String(row.vehicle.fleet_number || "").toLowerCase();
      const lineNumber = String(row.line?.number || "").toLowerCase();
      return fleetNumber.includes(needle) || lineNumber.includes(needle);
    });
  }, [rows, query, onlyActive, onlyFavorites, favorites]);

  const toggleFavorite = (id) => {
    setFavorites((previous) => {
      const next = previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  const openVehicle = (id) => {
    navigate({ to: "/", search: { vehicle: id } });
  };

  const quickStart = (row) => {
    const next = nextDepartureAcross([row], sim.dayKey, sim.simMinutes);
    if (next != null) sim.setSimMinutes(next);
    sim.setMode("sim");
    sim.setRunning(true);
    navigate({ to: "/", search: { vehicle: row.vehicle.id } });
  };

  // Budzimy wóz z zajezdni — wraca do kursu ze zmęczeniem odpowiednim do godziny.
  const wakeVehicle = async (row) => {
    await base44.entities.Vehicle.update(row.vehicle.id, {
      depot_sleep: false,
      fatigue: wakeFatigueValue(row.vehicle, sim.simMinutes),
    });
    await reload();
  };

  // Usypiamy wóz w zajezdni — staje na pętli startowej i odpoczywa.
  const sleepVehicle = async (row) => {
    await base44.entities.Vehicle.update(row.vehicle.id, { depot_sleep: true, fatigue: 0 });
    await reload();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tabor</p>
          <h1 className="mt-1.5 font-display text-3xl leading-none sm:text-4xl">Wykaz pojazdów</h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            Cała flota w jednym miejscu. Kliknij brygadę, aby przejść na mapę i wycentrować widok na pojeździe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/linie"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary"
          >
            Pojazdy na liniach <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/builder"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary"
          >
            Zarządzaj taborem <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <FleetFilters
        query={query}
        onQueryChange={setQuery}
        onlyActive={onlyActive}
        onToggleActive={() => setOnlyActive((value) => !value)}
        onlyFavorites={onlyFavorites}
        onToggleFavorites={() => setOnlyFavorites((value) => !value)}
        activeCount={activeCount}
      />

      {loading ? (
        <div className="surface h-64 animate-pulse" />
      ) : (
        <FleetTable
          rows={filtered}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onOpenVehicle={openVehicle}
          onQuickStart={quickStart}
          onWakeVehicle={wakeVehicle}
          onSleepVehicle={sleepVehicle}
          secondsAgo={secondsAgo}
          dayKey={sim.dayKey}
        />
      )}

      <p className="mt-4 text-[11px] text-muted-foreground">
        {filtered.length} z {rows.length} pojazdów · {activeCount} w trasie
      </p>
    </div>
  );
}
