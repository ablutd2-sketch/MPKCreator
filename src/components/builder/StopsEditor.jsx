import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MousePointerClick, RefreshCw, Save, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import LineBadge from "@/components/LineBadge";
import StopRow from "@/components/builder/StopRow";
import AssignmentModeEditor from "@/components/builder/AssignmentModeEditor";
import { autoLineName, isNightNumber } from "@/lib/lineUtils";
import { fetchRoadPath, pathDistanceKm } from "@/lib/routing";
import { parseStopsFile } from "@/lib/stopsImport";
import { cn } from "@/lib/utils";

const StopsMap = lazy(() => import("@/components/builder/StopsMap"));

export default function StopsEditor({ draft, onChange, onSave, saving, vehicles = [] }) {
  const [error, setError] = useState("");
  const [placingBack, setPlacingBack] = useState(null);
  const [placingVia, setPlacingVia] = useState(false);
  const [selected, setSelected] = useState(0);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const fileRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const lastSignature = useRef(null);

  const stops = Array.isArray(draft.stops) ? draft.stops : [];
  const models = useMemo(
    () => [...new Set(vehicles.map((vehicle) => String(vehicle.model || "").trim()).filter(Boolean))].sort(),
    [vehicles]
  );

  const patch = (changes) => onChange({ ...draft, ...changes });

  const updateStop = (index, changes) => {
    onChange({ ...draft, stops: stops.map((stop, i) => (i === index ? { ...stop, ...changes } : stop)) });
  };

  const addStop = (lat, lng) => {
    const index = stops.length;
    const lat6 = Number(lat.toFixed(6));
    const lng6 = Number(lng.toFixed(6));
    onChange({
      ...draft,
      stops: [
        ...stops,
        {
          name: `Przystanek ${index + 1}`,
          lat: lat6,
          lng: lng6,
          pole: "01",
          lat_back: lat6,
          lng_back: lng6,
          pole_back: "02",
        },
      ],
    });
    setSelected(index);
  };

  const removeStop = (index) => {
    onChange({ ...draft, stops: stops.filter((_, i) => i !== index) });
    setSelected((current) => Math.max(0, Math.min(current, stops.length - 2)));
    if (placingBack === index) setPlacingBack(null);
  };

  const moveStop = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= stops.length) return;
    const next = [...stops];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...draft, stops: next });
    setSelected(target);
  };

  const placeBackPole = (lat, lng) => {
    if (placingBack == null) return;
    updateStop(placingBack, { lat_back: Number(lat.toFixed(6)), lng_back: Number(lng.toFixed(6)) });
    setPlacingBack(null);
  };

  const addViaPoint = (lat, lng) => {
    const current = draftRef.current;
    onChange({
      ...current,
      via_petla: [
        ...(Array.isArray(current.via_petla) ? current.via_petla : []),
        { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) },
      ],
    });
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseStopsFile(text);
    if (!parsed.length) {
      setError("Nie rozpoznano przystanków. Użyj formatu stops.txt (stop_id, stop_name, stop_lat, stop_lon).");
      return;
    }
    patch({
      stops: [
        ...stops,
        ...parsed.map((stop) => ({
          ...stop,
          pole: "01",
          lat_back: stop.lat,
          lng_back: stop.lng,
          pole_back: "02",
        })),
      ],
    });
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const viaPoints = useMemo(
    () =>
      (Array.isArray(draft.via_petla) ? draft.via_petla : []).map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
      })),
    [draft.via_petla]
  );

  const signature = useMemo(
    () =>
      JSON.stringify([
        stops.map((stop) => [
          Number(stop.lat),
          Number(stop.lng),
          Number(stop.lat_back ?? stop.lat),
          Number(stop.lng_back ?? stop.lng),
        ]),
        viaPoints.map((point) => [point.lat, point.lng]),
      ]),
    [stops, viaPoints]
  );

  useEffect(() => {
    const current = draftRef.current;
    const list = Array.isArray(current.stops) ? current.stops : [];
    const hasPaths = (current.path_tam || []).length > 1 && (current.path_powrot || []).length > 1;

    if (list.length < 2) {
      lastSignature.current = null;
      setRouting(false);
      setRouteError("");
      if ((current.path_tam || []).length || (current.path_powrot || []).length) {
        onChange({ ...current, path_tam: [], path_powrot: [] });
      }
      return undefined;
    }

    if (hasPaths && lastSignature.current === null) {
      lastSignature.current = signature;
    }
    if (hasPaths && lastSignature.current === signature && attempt === 0) {
      setRouting(false);
      return undefined;
    }

    let cancelled = false;
    setRouting(true);
    setRouteError("");

    const timer = setTimeout(async () => {
      try {
        const tamBase = list.map((stop) => ({ lat: Number(stop.lat), lng: Number(stop.lng) }));
        const backBase = [...list]
          .reverse()
          .map((stop) => ({ lat: Number(stop.lat_back ?? stop.lat), lng: Number(stop.lng_back ?? stop.lng) }));

        const terminus = tamBase[tamBase.length - 1];
        const circuit = tamBase.length >= 3 && pathDistanceKm([tamBase[0], terminus]) < 0.2;
        const tam = await fetchRoadPath(viaPoints.length ? [...tamBase, ...viaPoints, terminus] : tamBase);
        const powrot = circuit ? tam : await fetchRoadPath(backBase);
        if (cancelled) return;
        lastSignature.current = signature;
        setRouting(false);
        onChange({ ...draftRef.current, path_tam: tam, path_powrot: powrot });
      } catch {
        if (cancelled) return;
        setRouting(false);
        setRouteError("Nie udało się wyznaczyć trasy po drogach. Spróbuj ponownie.");
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signature, attempt]);

  const hasRoute = (draft.path_tam || []).length > 1 && (draft.path_powrot || []).length > 1;
  const needsRoute = stops.length >= 2;
  const routeKm = hasRoute ? pathDistanceKm(draft.path_tam) : 0;
  const direction = autoLineName(stops);
  const night = Boolean(draft.night) || isNightNumber(draft.number);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <div className="h-[320px] w-full sm:h-[460px]">
          <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
              <StopsMap
                fitKey={draft.id}
                stops={stops}
                color={draft.color}
                pathTam={draft.path_tam}
                pathPowrot={draft.path_powrot}
                onAdd={addStop}
                onPlaceBack={placeBackPole}
                placingBack={placingBack}
                via={viaPoints}
                onPlaceVia={addViaPoint}
                placingVia={placingVia}
              />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 bg-card px-3 py-2 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MousePointerClick className="h-3.5 w-3.5" />
            {placingVia
              ? "Klikaj na mapie kolejne punkty pętli, zgodnie z kierunkiem jazdy."
              : placingBack != null
                ? `Kliknij na mapie, aby ustawić słupek ${stops[placingBack]?.pole_back || "02"}`
                : "Kliknij na mapie: pierwszy punkt to początek, ostatni to koniec trasy."}
          </span>
          {(placingBack != null || placingVia) && (
            <button
              type="button"
              onClick={() => {
                setPlacingBack(null);
                setPlacingVia(false);
              }}
              className="font-semibold text-primary"
            >
              Anuluj
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="surface p-3">
          <div className="flex items-center gap-2">
            <Input
              value={draft.number}
              onChange={(event) => patch({ number: event.target.value })}
              placeholder="101"
              aria-label="Numer linii"
              className="h-9 w-[74px] font-mono text-[13px] font-semibold"
            />
            <LineBadge line={{ number: draft.number, night }} />
            <button
              type="button"
              onClick={() => patch({ night: !draft.night })}
              className={cn(
                "ml-auto rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                draft.night
                  ? "border-black bg-black text-white"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Linia nocna
            </button>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => patch({ color: event.target.value })}
              className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-card"
              aria-label="Kolor linii"
            />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            {direction ? (
              <>
                Kierunek: <span className="font-medium text-foreground">{direction}</span> / odwrotny:{" "}
                <span className="font-medium text-foreground">
                  {direction.split(" → ").reverse().join(" → ")}
                </span>
              </>
            ) : (
              "Kierunek wygeneruje się automatycznie po dodaniu przystanku początkowego i końcowego."
            )}
          </p>
        </div>

        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
            <p className="eyebrow">Przystanki</p>
            <span className="num text-[10px] text-muted-foreground">{stops.length}</span>
          </div>

          <ul className="max-h-[280px] overflow-y-auto">
            {stops.length === 0 && (
              <li className="px-3 py-4 text-[11.5px] text-muted-foreground">
                Kliknij na mapie, aby dodać przystanek początkowy.
              </li>
            )}
            {stops.map((stop, index) => (
              <StopRow
                key={`${stop.lat}-${stop.lng}-${index}`}
                stop={stop}
                index={index}
                total={stops.length}
                selected={selected === index}
                placingBack={placingBack === index}
                onSelect={() => setSelected(index)}
                onChange={(changes) => updateStop(index, changes)}
                onRemove={() => removeStop(index)}
                onMove={(direction) => moveStop(index, direction)}
                onPlaceBack={() => setPlacingBack(placingBack === index ? null : index)}
                onAddVia={() => addViaPoint(Number(stop.lat), Number(stop.lng))}
              />
            ))}
          </ul>
        </div>

        <div className="surface p-3">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Punkty na pętli</p>
            <span className="num text-[10px] text-muted-foreground">{viaPoints.length}</span>
          </div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Klikaj kolejne punkty wokół pętli (2–3 wystarczą, zgodnie z kierunkiem jazdy) — autobus objedzie ją
            i wróci na przystanek końcowy.
          </p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setPlacingVia((value) => !value)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-[10.5px] font-semibold transition-colors",
                placingVia
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {placingVia ? "Kliknij mapę" : "Dodaj punkt"}
            </button>
            {viaPoints.length > 0 && (
              <button
                type="button"
                onClick={() => patch({ via_petla: [] })}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-[10.5px] font-semibold text-muted-foreground hover:text-destructive"
              >
                Wyczyść
              </button>
            )}
          </div>
        </div>

        <div className="surface p-3">
          <p className="eyebrow">Przydział taboru</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Bez przypisania do linii autobus nie wyjedzie na trasę.
          </p>
          <div className="mt-2">
            <AssignmentModeEditor
              value={{
                mode: draft.assignment_mode || "manual",
                model_filter: draft.model_filter || "",
                model_mix: draft.model_mix || [],
                manual_vehicles: draft.manual_vehicles || [],
              }}
              models={models}
              vehicles={vehicles}
              onChange={(next) =>
                patch({
                  assignment_mode: next.mode,
                  model_filter: next.model_filter,
                  model_mix: next.model_mix,
                  manual_vehicles: next.manual_vehicles,
                })
              }
            />
          </div>
        </div>

        {needsRoute && (
          <div
            className={cn(
              "flex items-start gap-1.5 rounded-xl border px-3 py-2 text-[10.5px] leading-snug",
              routeError
                ? "border-destructive/40 bg-destructive/5 text-destructive"
                : "border-border bg-secondary/40 text-muted-foreground"
            )}
          >
            {routing ? (
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="flex-1">
              {routing
                ? "Wyznaczam trasę po prawdziwych drogach (OSRM)…"
                : routeError || (hasRoute ? `Trasa po drogach gotowa · ${routeKm.toFixed(1)} km` : "Brak geometrii trasy.")}
            </span>
            {!routing && (
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="shrink-0 font-semibold text-primary"
              >
                Przelicz
              </button>
            )}
          </div>
        )}

        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}

        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-3 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Upload className="h-3.5 w-3.5" />
          Import stops.txt / CSV
          <input ref={fileRef} type="file" accept=".txt,.csv" onChange={importFile} className="hidden" />
        </label>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || routing || (needsRoute && !hasRoute)}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Zapisuję…" : "Zapisz trasę"}
        </button>
        {needsRoute && !hasRoute && !routing && (
          <p className="text-center text-[10px] text-muted-foreground">
            Zapis możliwy po wyznaczeniu trasy po drogach.
          </p>
        )}
      </div>
    </div>
  );
}
