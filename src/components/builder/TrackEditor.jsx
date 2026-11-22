import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import LineBadge from "@/components/LineBadge";
import { pathDistanceKm } from "@/lib/routing";
import { useTransitData } from "@/lib/useTransitData";

const TrackMap = lazy(() => import("@/components/builder/TrackMap"));

export default function TrackEditor() {
  const { lines, loading, reload } = useTransitData();
  const [lineId, setLineId] = useState("");
  const [points, setPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const skipSave = useRef(true);

  const tramLines = useMemo(() => lines.filter((item) => item.tram), [lines]);
  const line = useMemo(() => tramLines.find((item) => item.id === lineId) || null, [tramLines, lineId]);
  const stops = useMemo(() => (Array.isArray(line?.stops) ? line.stops : []), [line]);
  const km = useMemo(() => pathDistanceKm(points), [points]);

  useEffect(() => {
    if (!tramLines.length) {
      if (lineId) setLineId("");
      return;
    }
    if (!tramLines.some((item) => item.id === lineId)) setLineId(tramLines[0].id);
  }, [tramLines, lineId]);

  useEffect(() => {
    skipSave.current = true;
    setPoints(
      Array.isArray(line?.path_tam)
        ? line.path_tam.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
        : []
    );
  }, [line?.id]);

  // Tor zapisuje się sam po każdym kliknięciu, żeby symulacja od razu jechała po nim.
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return undefined;
    }
    if (!line || points.length < 2) return undefined;

    const timer = setTimeout(async () => {
      try {
        await base44.entities.Line.update(line.id, { tram: true, path_tam: points, path_powrot: [] });
        await reload();
      } catch {
        toast.error("Nie udało się zapisać toru.");
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [points]);

  const addPoint = (lat, lng) =>
    setPoints((current) => [...current, { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }]);

  const save = async () => {
    if (!line) return;
    if (points.length < 2) {
      toast.error("Dodaj co najmniej dwa punkty toru.");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Line.update(line.id, { tram: true, path_tam: points, path_powrot: [] });
      await reload();
      toast.success(`Tor linii ${line.number} zapisany · ${km.toFixed(1)} km`);
    } catch {
      toast.error("Nie udało się zapisać toru.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="surface h-80 animate-pulse" />;

  if (!lines.length) {
    return (
      <div className="surface p-6 text-[13px] text-muted-foreground">
        Najpierw utwórz linię i przystanki w zakładce Trasy i przystanki.
      </div>
    );
  }

  if (!tramLines.length) {
    return (
      <div className="surface p-6 text-[13px] text-muted-foreground">
        Brak linii tramwajowych. Oznacz linię jako tramwajową w zakładce Trasy i przystanki — dopiero wtedy rysujesz
        dla niej tor.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <div className="h-[320px] w-full sm:h-[520px]">
          <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
              <TrackMap fitKey={line?.id} points={points} stops={stops} onAdd={addPoint} />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="border-t border-border/70 bg-card px-3 py-2 text-[10.5px] text-muted-foreground">
          Klikaj punkty wzdłuż torowiska — tor nie jest prowadzony po drogach.
        </div>
      </div>

      <div className="space-y-3">
        <div className="surface p-3">
          <p className="eyebrow">Linia</p>
          <select
            value={lineId}
            onChange={(event) => setLineId(event.target.value)}
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-2 text-[13px] font-medium"
            aria-label="Linia"
          >
            {tramLines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.number} · {item.name || "bez przystanków"}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2">
            <LineBadge line={line} />
            <span className="num text-[11px] text-muted-foreground">
              {points.length} pkt · {km.toFixed(2)} km · {stops.length} przyst.
            </span>
          </div>
        </div>

        <div className="surface p-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPoints((current) => current.slice(0, -1))}
              disabled={!points.length}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-[10.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Cofnij
            </button>
            <button
              type="button"
              onClick={() => setPoints([])}
              disabled={!points.length}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-[10.5px] font-semibold text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wyczyść
            </button>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || points.length < 2}
            className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Zapisuję…" : "Zapisz tor"}
          </button>

          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            Tor zapisuje się sam po każdym kliknięciu. Linia staje się tramwajowa, a trasę powrotną tworzy ten sam
            tor w drugą stronę.
          </p>
        </div>
      </div>
    </div>
  );
}
