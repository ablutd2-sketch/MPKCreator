import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import MapControls from "@/components/map/MapControls";
import ActiveVehiclesPanel from "@/components/map/ActiveVehiclesPanel";
import OffRouteAlarm from "@/components/map/OffRouteAlarm";
import { useSimulation } from "@/lib/SimulationContext";
import { buildLiveItems } from "@/lib/livePositions";
import { applyEscapes } from "@/lib/escape";
import { detectOffRoute } from "@/lib/offRoute";
import { computeFleetState, departuresFor, nextDepartureAcross } from "@/lib/simulation";
import { useLivePositions, useTransitData } from "@/lib/useTransitData";

const LiveMap = lazy(() => import("@/components/map/LiveMap"));

export const Route = createFileRoute("/_site/")({
  validateSearch: (search) => ({
    vehicle: typeof search.vehicle === "string" ? search.vehicle : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mapa na żywo · BusTracker PL" },
      {
        name: "description",
        content: "Śledź autobusy w całej Polsce na mapie w trybie symulacji albo podłącz prawdziwe dane GPS.",
      },
    ],
  }),
  component: LiveMapPage,
});

function MapFallback() {
  return <div className="h-full w-full animate-pulse bg-secondary" />;
}

function EmptyHint() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[550] flex items-center justify-center px-4">
      <div className="pointer-events-auto max-w-sm rounded-2xl border border-border/70 bg-card/95 p-5 text-center shadow-[0_30px_70px_-40px_rgba(18,26,43,0.8)] backdrop-blur-xl">
        <p className="eyebrow">Brak pojazdów</p>
        <h2 className="mt-2 font-display text-2xl leading-tight">Zacznij od jednego autobusu</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Dodaj pojazd, ułóż trasę z przystankami i przypisz kursy. Potem uruchom symulację i zobacz autobusy na mapie.
        </p>
        <Link
          to="/builder"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground"
        >
          Otwórz kreator <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function LiveMapPage() {
  const sim = useSimulation();
  const { vehicle: focusId } = Route.useSearch();
  const { vehicles, lines, assignments, loading } = useTransitData();
  const positions = useLivePositions(sim.mode === "live");
  const liveItems = useMemo(() => buildLiveItems(positions, vehicles, lines), [positions, vehicles, lines]);
  const [focus, setFocus] = useState(null);
  const focusedRef = useRef(null);

  const fleet = useMemo(
    () => computeFleetState({ vehicles, lines, assignments, simMinutes: sim.simMinutes, dayKey: sim.dayKey }),
    [vehicles, lines, assignments, sim.simMinutes, sim.dayKey]
  );

  const active = useMemo(() => fleet.filter((item) => item.state), [fleet]);
  const dayHasCourses = useMemo(
    () => fleet.some((item) => departuresFor(item.assignment, sim.dayKey).length > 0),
    [fleet, sim.dayKey]
  );
  const simulated = useMemo(
    () => applyEscapes(active, { simMinutes: sim.simMinutes }),
    [active, sim.simMinutes]
  );
  const shown = sim.mode === "live" ? liveItems : simulated;
  const offRoute = useMemo(() => detectOffRoute(shown), [shown]);
  const alarmedRef = useRef(new Set());

  useEffect(() => {
    offRoute.forEach((alert) => {
      if (alarmedRef.current.has(alert.vehicle.id)) return;
      alarmedRef.current.add(alert.vehicle.id);
      toast.error(
        `Alarm: ${alert.vehicle.fleet_number} (linia ${alert.line?.number || "?"}) zjechał z trasy`,
        {
          description:
            alert.distanceM >= 1000
              ? `${(alert.distanceM / 1000).toFixed(0)} km od trasy`
              : `${Math.round(alert.distanceM)} m od trasy`,
          duration: 8000,
        }
      );
    });
    [...alarmedRef.current].forEach((id) => {
      if (!offRoute.some((alert) => alert.vehicle.id === id)) alarmedRef.current.delete(id);
    });
  }, [offRoute]);

  useEffect(() => {
    if (!focusId || focusedRef.current === focusId) return;
    const item = fleet.find((entry) => entry.vehicle.id === focusId);
    const point =
      item?.state || (item?.line?.stops?.[0] ? { lat: item.line.stops[0].lat, lng: item.line.stops[0].lng } : null);
    if (point) {
      focusedRef.current = focusId;
      setFocus({ lat: point.lat, lng: point.lng });
    }
  }, [focusId, fleet]);

  const handleStart = () => {
    if (!active.length) {
      const next = nextDepartureAcross(fleet, sim.dayKey, sim.simMinutes);
      if (next != null) sim.setSimMinutes(next);
    }
    sim.setRunning(true);
  };

  return (
    <div className="relative h-[calc(100dvh-56px)] w-full overflow-hidden sm:h-[calc(100dvh-64px)]">
      <ClientOnly fallback={<MapFallback />}>
        <Suspense fallback={<MapFallback />}>
          <LiveMap items={shown} focus={focus} />
        </Suspense>
      </ClientOnly>

      <MapControls
        onStart={handleStart}
        onPause={() => sim.setRunning(false)}
        activeCount={shown.length}
        liveCount={liveItems.length}
        dayHasCourses={dayHasCourses}
      />

      <OffRouteAlarm alerts={offRoute} />

      {shown.length > 0 && (
        <ActiveVehiclesPanel items={shown} onSelect={(item) => setFocus({ lat: item.state.lat, lng: item.state.lng })} />
      )}

      {!loading && vehicles.length === 0 && <EmptyHint />}
    </div>
  );
}
