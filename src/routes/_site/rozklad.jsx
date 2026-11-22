import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import DepartureBoard from "@/components/timetable/DepartureBoard";
import StopPicker from "@/components/timetable/StopPicker";
import { useSimulation } from "@/lib/SimulationContext";
import { DAY_CHIPS, DAY_KEYS, DAY_LABELS } from "@/lib/simulation";
import { collectStops, groupByHour, stopDepartures } from "@/lib/stopTimetable";
import { useTransitData } from "@/lib/useTransitData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_site/rozklad")({
  validateSearch: (search) => ({
    przystanek: typeof search.przystanek === "string" ? search.przystanek : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Rozkład jazdy · BusTracker PL" },
      {
        name: "description",
        content: "Tabela odjazdów z przystanku: wszystkie linie, kierunki i brygady w jednym miejscu.",
      },
    ],
  }),
  component: TimetablePage,
});

function TimetablePage() {
  const { lines, assignments, loading } = useTransitData();
  const sim = useSimulation();
  const navigate = useNavigate();
  const { przystanek } = Route.useSearch();
  const [dayKey, setDayKey] = useState(sim.dayKey);
  const [query, setQuery] = useState("");

  const stops = useMemo(() => collectStops(lines), [lines]);

  const filteredStops = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return stops;
    return stops.filter((stop) => stop.name.toLowerCase().includes(needle));
  }, [stops, query]);

  const selected = useMemo(
    () => stops.find((stop) => stop.key === przystanek) || filteredStops[0] || stops[0] || null,
    [stops, filteredStops, przystanek]
  );

  const rows = useMemo(
    () => (selected ? stopDepartures({ lines: selected.lines, assignments, dayKey, key: selected.key }) : []),
    [selected, assignments, dayKey]
  );
  const groups = useMemo(() => groupByHour(rows), [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Przystanki</p>
          <h1 className="mt-1.5 font-display text-3xl leading-none sm:text-4xl">Rozkład jazdy</h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            Słupki o tej samej nazwie (np. 01 i 02) są scalone w jeden przystanek — widzisz odjazdy wszystkich linii i
            obu kierunków.
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {DAY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setDayKey(key)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                key === dayKey
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {DAY_CHIPS[key]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="surface h-64 animate-pulse" />
      ) : stops.length === 0 ? (
        <div className="surface p-6 text-[13px] text-muted-foreground">
          Brak przystanków — dodaj trasę w kreatorze, aby zobaczyć rozkład.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <StopPicker
            stops={filteredStops}
            query={query}
            onQueryChange={setQuery}
            selectedKey={selected?.key || ""}
            onSelect={(key) => navigate({ to: "/rozklad", search: { przystanek: key } })}
          />
          <DepartureBoard stop={selected} groups={groups} dayLabel={DAY_LABELS[dayKey]} />
        </div>
      )}
    </div>
  );
}
