import { useMemo, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import AssignmentModeEditor from "@/components/builder/AssignmentModeEditor";
import { DAY_CHIPS, DAY_KEYS } from "@/lib/simulation";
import { assignVehiclesToBrigades, buildTaktPlan, TAKT_OPTIONS } from "@/lib/taktGenerator";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary";

const PRESETS = [
  { label: "Pon–Pt", days: ["mon", "tue", "wed", "thu", "fri"] },
  { label: "Sob", days: ["sat"] },
  { label: "Nd", days: ["sun"] },
  { label: "Każdy dzień", days: [...DAY_KEYS] },
];

export default function TaktGenerator({ lines, vehicles, assignments, onGenerated }) {
  const [lineId, setLineId] = useState("");
  const [firstTime, setFirstTime] = useState("05:00");
  const [lastTime, setLastTime] = useState("22:30");
  const [takt, setTakt] = useState(15);
  const [layover, setLayover] = useState(5);
  const [days, setDays] = useState(["mon", "tue", "wed", "thu", "fri"]);
  const [assignment, setAssignment] = useState({ mode: "model", model_filter: "", model_mix: [] });
  const [manualIds, setManualIds] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const line = lines.find((item) => item.id === lineId) || null;
  const models = useMemo(
    () => [...new Set(vehicles.map((vehicle) => String(vehicle.model || "").trim()).filter(Boolean))].sort(),
    [vehicles]
  );

  const busy = useMemo(
    () =>
      new Set(
        assignments
          .filter((item) => item.vehicle_id && item.line_id !== lineId)
          .map((item) => item.vehicle_id)
      ),
    [assignments, lineId]
  );
  const freeVehicles = useMemo(() => vehicles.filter((vehicle) => !busy.has(vehicle.id)), [vehicles, busy]);

  const plan = useMemo(
    () => (line ? buildTaktPlan({ line, firstTime, lastTime, takt, layoverMin: layover }) : null),
    [line, firstTime, lastTime, takt, layover]
  );

  const toggleDay = (day) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));

  const toggleVehicle = (id) =>
    setManualIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const generate = async () => {
    if (!line) {
      setError("Wybierz linię.");
      return;
    }
    if (!plan || plan.error) {
      setError(plan?.error || "Nie udało się policzyć taktu.");
      return;
    }
    if (!days.length) {
      setError("Wybierz co najmniej jeden dzień tygodnia.");
      return;
    }
    if (assignment.mode === "model" && !String(assignment.model_filter || "").trim()) {
      setError("Wpisz model dopuszczony na linii, np. Solaris Urbino 12.");
      return;
    }
    const mix = (assignment.model_mix || []).filter(
      (entry) => String(entry.model || "").trim() && Number(entry.percent) > 0
    );
    if (assignment.mode === "percentage" && mix.length === 0) {
      setError("Dodaj modele i ich udziały procentowe.");
      return;
    }
    if (assignment.mode === "manual" && manualIds.length === 0) {
      setError("Wskaż wozy, które mają obsłużyć brygady.");
      return;
    }

    const existing = assignments.filter((item) => item.line_id === line.id);
    if (
      existing.length &&
      !window.confirm(`Linia ${line.number} ma już ${existing.length} brygad. Zastąpić je nowym rozkładem?`)
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const vehicleIds = assignVehiclesToBrigades({
        mode: assignment.mode,
        modelFilter: assignment.model_filter,
        mix,
        manualIds,
        vehicles: freeVehicles,
        count: plan.brigades.length,
      });

      await base44.entities.Line.update(line.id, { layover_min: plan.layover });

      if (existing.length) await base44.entities.Assignment.deleteMany({ line_id: line.id });

      const payload = plan.brigades.map((brigade, index) => ({
        line_id: line.id,
        brigade: brigade.number,
        vehicle_id: vehicleIds[index] || "",
        ...DAY_KEYS.reduce(
          (acc, day) => ({ ...acc, [day]: days.includes(day) ? brigade.times : [] }),
          {}
        ),
      }));

      await base44.entities.Assignment.bulkCreate(payload);

      const missing = payload.filter((item) => !item.vehicle_id).length;
      toast.success(
        missing
          ? `Wygenerowano ${payload.length} brygad, ${missing} bez wolnego wozu`
          : `Wygenerowano ${payload.length} brygad · ${plan.departures} kursów na dzień`
      );
      onGenerated?.();
    } catch {
      setError("Nie udało się wygenerować rozkładu. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Automatyczny generator</p>
          <h2 className="mt-1 font-display text-2xl leading-none">Rozkład taktowy</h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Jednym kliknięciem: brygady, kursy TAM / POWRÓT i obsada z taboru.
          </p>
        </div>
        <Wand2 className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select value={lineId} onChange={(event) => setLineId(event.target.value)} className={cn(selectClass, "sm:col-span-2")}>
          <option value="">Wybierz linię…</option>
          {lines.map((item) => (
            <option key={item.id} value={item.id}>
              {item.number} · {item.name || `Linia ${item.number}`} ({(item.stops || []).length} przyst.)
            </option>
          ))}
        </select>

        <label className="block">
          <span className="eyebrow">Pierwszy odjazd</span>
          <Input type="time" value={firstTime} onChange={(event) => setFirstTime(event.target.value)} className="mt-1 h-10" />
        </label>
        <label className="block">
          <span className="eyebrow">Ostatni odjazd</span>
          <Input type="time" value={lastTime} onChange={(event) => setLastTime(event.target.value)} className="mt-1 h-10" />
        </label>

        <label className="block">
          <span className="eyebrow">Takt (co ile minut)</span>
          <select value={takt} onChange={(event) => setTakt(Number(event.target.value))} className={cn(selectClass, "mt-1")}>
            {TAKT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                co {option} min
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow">Postój na pętli (min)</span>
          <Input
            type="number"
            min="0"
            max="60"
            value={layover}
            onChange={(event) => setLayover(Number(event.target.value))}
            className="num mt-1 h-10"
          />
        </label>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDays(preset.days)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {DAY_KEYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "rounded-lg border py-1.5 text-[10.5px] font-semibold transition-colors",
                days.includes(day)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {DAY_CHIPS[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border/70 bg-secondary/30 p-2.5">
        <p className="eyebrow">Obsada wygenerowanych brygad</p>
        <div className="mt-2">
          <AssignmentModeEditor value={assignment} onChange={setAssignment} models={models} compact />
        </div>

        {assignment.mode === "manual" && (
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {freeVehicles.length === 0 && (
              <p className="text-[10.5px] text-muted-foreground">Brak wolnych wozów w taborze.</p>
            )}
            {freeVehicles.map((vehicle) => {
              const order = manualIds.indexOf(vehicle.id);
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => toggleVehicle(vehicle.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors",
                    order >= 0 ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <span className="num w-5 shrink-0 text-[10px] font-semibold text-muted-foreground">
                    {order >= 0 ? order + 1 : "–"}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-mono font-semibold">{vehicle.fleet_number}</span>
                    <span className="ml-1.5 text-muted-foreground">{vehicle.model || "Autobus"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {line && (
        <div className="mt-3 rounded-xl border border-border/70 bg-card px-3 py-2.5">
          {plan?.error ? (
            <p className="text-[11.5px] font-medium text-destructive">{plan.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span>
                  Cykl: <b className="num text-foreground">{plan.cycleMin} min</b>
                </span>
                <span>
                  Brygady: <b className="num text-foreground">{plan.brigades.length}</b>
                </span>
                <span>
                  Kursy na dzień: <b className="num text-foreground">{plan.departures}</b>
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {plan.brigades.map((brigade) => (
                  <span
                    key={brigade.number}
                    className="num rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                  >
                    {brigade.number} · {brigade.times[0]}–{brigade.times[brigade.times.length - 1]}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-[11.5px] font-medium text-destructive">{error}</p>}

      <button
        type="button"
        onClick={generate}
        disabled={saving}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {saving ? "Generuję rozkład…" : "Wygeneruj rozkład"}
      </button>
    </div>
  );
}
