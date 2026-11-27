import { Suspense, lazy, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { fetchRoadPath, pathDistanceKm } from "@/lib/routing";
import { boundsFromCorners, clipPathToArea, pointInArea } from "@/lib/techRun";
import TechRunList from "@/components/builder/TechRunList";

const TechRunMap = lazy(() => import("@/components/builder/TechRunMap"));

function hintFor({ area, draftCorner, start, end }) {
  if (!area) return draftCorner ? "Kliknij drugi narożnik obszaru." : "Kliknij pierwszy narożnik obszaru.";
  if (!start) return "Kliknij początek przejazdu.";
  if (!end) return "Kliknij koniec przejazdu.";
  return "Koniec możesz przesunąć kolejnym kliknięciem na mapie.";
}

export default function TechRunEditor() {
  const [runs, setRuns] = useState([]);
  const [area, setArea] = useState(null);
  const [draftCorner, setDraftCorner] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [name, setName] = useState("");
  const [routing, setRouting] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRuns = async () => {
    const list = await base44.entities.TechnicalRun.list("-created_date", 30);
    setRuns(Array.isArray(list) ? list : list?.items || []);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  // Kolejne kliknięcia: dwa narożniki obszaru, potem początek i koniec przejazdu.
  const pick = (lat, lng) => {
    const point = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    setPath([]);

    if (!area) {
      if (!draftCorner) {
        setDraftCorner(point);
        return;
      }
      setArea(boundsFromCorners(draftCorner, point));
      setDraftCorner(null);
      return;
    }

    if (!start) {
      setStart(point);
      return;
    }

    setEnd(point);
  };

  const reset = () => {
    setArea(null);
    setDraftCorner(null);
    setStart(null);
    setEnd(null);
    setPath([]);
    setName("");
  };

  const computeRoute = async () => {
    if (!area) {
      toast.error("Najpierw zaznacz obszar przejazdu.");
      return;
    }
    if (!start || !end) {
      toast.error("Wskaż początek i koniec przejazdu.");
      return;
    }
    if (!pointInArea(start, area)) {
      toast.error("Początek przejazdu musi leżeć w zaznaczonym obszarze.");
      return;
    }

    setRouting(true);
    try {
      const road = await fetchRoadPath([start, end]);
      if (road.length < 2) throw new Error("brak trasy");

      // Obszar wyznacza maksymalny zasięg — trasa jedzie po drogach i kończy się na granicy.
      const clipped = clipPathToArea(road, area);
      if (clipped.length < 2) {
        setPath([]);
        toast.error("Nie udało się poprowadzić przejazdu w zaznaczonym obszarze.");
        return;
      }

      setPath(clipped);
      const toBorder = clipped.length < road.length;
      toast.success(
        toBorder
          ? `Przejazd do granicy obszaru · ${pathDistanceKm(clipped).toFixed(1)} km`
          : `Trasa wyznaczona · ${pathDistanceKm(clipped).toFixed(1)} km`
      );
    } catch {
      toast.error("Nie udało się wyznaczyć trasy po drogach.");
    } finally {
      setRouting(false);
    }
  };

  const save = async () => {
    if (!area || !start || !end || path.length < 2) {
      toast.error("Zaznacz obszar, wskaż punkty i wyznacz trasę.");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.TechnicalRun.create({
        name: name.trim() || `Przejazd techniczny ${runs.length + 1}`,
        start,
        end,
        path,
        area,
        distance_km: Number(pathDistanceKm(path).toFixed(2)),
      });
      setName("");
      setPath([]);
      await loadRuns();
      toast.success("Przejazd techniczny zapisany.");
    } catch {
      toast.error("Nie udało się zapisać przejazdu.");
    } finally {
      setSaving(false);
    }
  };

  const openRun = (run) => {
    setArea(run.area || null);
    setDraftCorner(null);
    setStart(run.start || null);
    setEnd(run.end || null);
    setPath(Array.isArray(run.path) ? run.path : []);
    setName(run.name || "");
  };

  const deleteRun = async (run) => {
    if (!window.confirm(`Usunąć przejazd „${run.name}”?`)) return;
    try {
      await base44.entities.TechnicalRun.delete(run.id);
      await loadRuns();
      toast.success("Przejazd usunięty.");
    } catch {
      toast.error("Nie udało się usunąć przejazdu.");
    }
  };

  const fitKey = `${area ? 1 : 0}-${start ? 1 : 0}-${end ? 1 : 0}-${path.length}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <div className="h-[320px] w-full sm:h-[520px]">
          <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
              <TechRunMap
                area={area}
                draftCorner={draftCorner}
                start={start}
                end={end}
                path={path}
                onPick={pick}
                fitKey={fitKey}
              />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-card px-3 py-2 text-[10.5px] text-muted-foreground">
          <span>{hintFor({ area, draftCorner, start, end })}</span>
          <button
            type="button"
            onClick={reset}
            className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[10.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Od nowa
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="surface p-3">
          <label className="eyebrow" htmlFor="tech-run-name">Nazwa przejazdu</label>
          <input
            id="tech-run-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="np. Zajezdnia → Początek linii"
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-2 text-[12.5px]"
          />

          <button
            type="button"
            onClick={computeRoute}
            disabled={routing}
            className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-[12px] font-semibold text-foreground disabled:opacity-50"
          >
            {routing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {routing ? "Wyznaczam trasę…" : "Wyznacz trasę po drogach"}
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving || path.length < 2}
            className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Zapisuję…" : "Zapisz przejazd"}
          </button>

          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            Obszar wyznacza maksymalny zasięg: przejazd jedzie po dostępnych drogach i kończy się na granicy obszaru.
          </p>
        </div>

        <TechRunList runs={runs} onOpen={openRun} onDelete={deleteRun} />
      </div>
    </div>
  );
}
