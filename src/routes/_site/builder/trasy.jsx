import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import EditorGate from "@/components/builder/EditorGate";
import LinesPanel from "@/components/builder/LinesPanel";
import StopsEditor from "@/components/builder/StopsEditor";
import { autoLineName, isNightNumber } from "@/lib/lineUtils";
import { useTransitData } from "@/lib/useTransitData";

export const Route = createFileRoute("/_site/builder/trasy")({
  component: RoutesPage,
});

const PALETTE = ["#C8102E", "#1B4DB1", "#0F7A5A", "#B26A00", "#6B3FA0", "#0B6E8A"];

function toDraft(line) {
  return {
    id: line.id,
    number: line.number || "",
    name: line.name || "",
    color: line.color || "#C8102E",
    night: Boolean(line.night) || isNightNumber(line.number),
    tram: Boolean(line.tram),
    stops: Array.isArray(line.stops) ? line.stops.map((stop) => ({ ...stop })) : [],
    path_tam: Array.isArray(line.path_tam) ? line.path_tam : [],
    path_powrot: Array.isArray(line.path_powrot) ? line.path_powrot : [],
    assignment_mode: line.assignment_mode || "manual",
    model_filter: line.model_filter || "",
    model_mix: Array.isArray(line.model_mix) ? line.model_mix.map((entry) => ({ ...entry })) : [],
    manual_vehicles: Array.isArray(line.manual_vehicles) ? [...line.manual_vehicles] : [],
    via_petla: Array.isArray(line.via_petla) ? line.via_petla.map((point) => ({ ...point })) : [],
  };
}

function RoutesPage() {
  const { lines, vehicles, loading, reload } = useTransitData();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lines.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !lines.some((line) => line.id === selectedId)) {
      setSelectedId(lines[0].id);
    }
  }, [lines, selectedId]);

  useEffect(() => {
    const line = lines.find((item) => item.id === selectedId);
    setDraft(line ? toDraft(line) : null);
  }, [selectedId, lines]);

  const createLine = async ({ number }) => {
    const color = PALETTE[lines.length % PALETTE.length];
    try {
      const created = await base44.entities.Line.create({
        number,
        color,
        stops: [],
        night: isNightNumber(number),
        assignment_mode: "manual",
        model_filter: "",
        model_mix: [],
      });
      await reload();
      setSelectedId(created.id);
      toast.success(`Linia ${number} utworzona. Klikaj przystanki na mapie.`);
    } catch {
      toast.error("Nie udało się utworzyć linii.");
    }
  };

  const deleteLine = async (line) => {
    if (!window.confirm(`Usunąć linię ${line.number} wraz z jej kursami?`)) return;
    try {
      await base44.entities.Assignment.deleteMany({ line_id: line.id });
      await base44.entities.Line.delete(line.id);
      await reload();
      toast.success("Linia usunięta");
    } catch {
      toast.error("Nie udało się usunąć linii.");
    }
  };

  const saveLine = async () => {
    if (!draft) return;
    if (!draft.number.trim()) {
      toast.error("Podaj numer linii.");
      return;
    }
    if (!draft.tram && draft.stops.length >= 2 && (!(draft.path_tam || []).length || !(draft.path_powrot || []).length)) {
      toast.error("Najpierw wyznacz trasę po drogach.");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Line.update(draft.id, {
        number: draft.number.trim(),
        name: autoLineName(draft.stops),
        color: draft.color,
        night: Boolean(draft.night),
        tram: Boolean(draft.tram),
        stops: draft.stops.map((stop) => ({
          name: String(stop.name || "").trim() || "Przystanek",
          lat: Number(stop.lat),
          lng: Number(stop.lng),
          pole: String(stop.pole || "01").trim() || "01",
          lat_back: Number(stop.lat_back ?? stop.lat),
          lng_back: Number(stop.lng_back ?? stop.lng),
          pole_back: String(stop.pole_back || "02").trim() || "02",
          petla: Boolean(stop.petla),
        })),
        path_tam: Array.isArray(draft.path_tam) ? draft.path_tam : [],
        path_powrot: Array.isArray(draft.path_powrot) ? draft.path_powrot : [],
        assignment_mode: draft.assignment_mode || "manual",
        model_filter: draft.model_filter || "",
        model_mix: Array.isArray(draft.model_mix) ? draft.model_mix : [],
        manual_vehicles: Array.isArray(draft.manual_vehicles) ? draft.manual_vehicles : [],
        via_petla: Array.isArray(draft.via_petla)
          ? draft.via_petla.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
          : [],
      });
      await reload();
      toast.success("Trasa zapisana");
    } catch {
      toast.error("Nie udało się zapisać trasy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorGate>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <LinesPanel
          lines={lines}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={createLine}
          onDelete={deleteLine}
        />

        <div>
          {loading ? (
            <div className="surface h-80 animate-pulse" />
          ) : draft ? (
            <StopsEditor
              key={draft.id}
              draft={draft}
              onChange={setDraft}
              onSave={saveLine}
              saving={saving}
              vehicles={vehicles}
            />
          ) : (
            <div className="surface flex flex-col items-center px-6 py-14 text-center">
              <h2 className="font-display text-2xl">Wybierz lub utwórz linię</h2>
              <p className="mt-1.5 max-w-sm text-[13px] text-muted-foreground">
                Wpisz numer linii i klikaj kolejne przystanki na mapie: początek, pośrednie i koniec trasy.
              </p>
            </div>
          )}
        </div>
      </div>
    </EditorGate>
  );
}
