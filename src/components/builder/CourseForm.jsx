import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import AssignmentModeEditor from "@/components/builder/AssignmentModeEditor";
import { DAY_KEYS, DAY_LABELS, parseTime } from "@/lib/simulation";
import { isNightLine } from "@/lib/lineUtils";

const emptyDays = () => DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
const emptyInputs = () => DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {});

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary";

const emptyAssignment = () => ({ mode: "manual", model_filter: "", model_mix: [] });

export default function CourseForm({ vehicles, lines, assignments, editing, onSaved, onCancelEdit }) {
  const [vehicleId, setVehicleId] = useState("");
  const [lineId, setLineId] = useState("");
  const [brigade, setBrigade] = useState("");
  const [assignment, setAssignment] = useState(emptyAssignment);
  const [times, setTimes] = useState(emptyDays);
  const [inputs, setInputs] = useState(emptyInputs);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const models = useMemo(
    () => [...new Set(vehicles.map((vehicle) => String(vehicle.model || "").trim()).filter(Boolean))].sort(),
    [vehicles]
  );

  const selectedLine = lines.find((line) => line.id === lineId) || null;
  const night = isNightLine(selectedLine);

  useEffect(() => {
    if (!editing) return;
    setVehicleId(editing.vehicle_id || "");
    setLineId(editing.line_id || "");
    setBrigade(editing.brigade || "");
    setTimes(DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: Array.isArray(editing[day]) ? [...editing[day]] : [] }), {}));

    const line = lines.find((item) => item.id === editing.line_id);
    setAssignment({
      mode: line?.assignment_mode || "manual",
      model_filter: line?.model_filter || "",
      model_mix: Array.isArray(line?.model_mix) ? line.model_mix.map((entry) => ({ ...entry })) : [],
    });
  }, [editing, lines]);

  const reset = () => {
    setVehicleId("");
    setLineId("");
    setBrigade("");
    setAssignment(emptyAssignment());
    setTimes(emptyDays());
    setInputs(emptyInputs());
    setError("");
  };

  const pickLine = (value) => {
    setLineId(value);
    const line = lines.find((item) => item.id === value);
    if (!line) return;
    if (!brigade.trim()) setBrigade(`${line.number}-01`);
    setAssignment({
      mode: line.assignment_mode || "manual",
      model_filter: line.model_filter || "",
      model_mix: Array.isArray(line.model_mix) ? line.model_mix.map((entry) => ({ ...entry })) : [],
    });
  };

  const addTime = (day) => {
    const value = inputs[day];
    const minutes = parseTime(value);
    if (minutes == null) {
      setError("Podaj poprawną godzinę odjazdu.");
      return;
    }
    if (!night && (minutes < 5 * 60 || minutes > 23 * 60)) {
      setError("Linia dzienna obsługuje godziny 05:00–23:00. Oznacz linię jako nocną, aby dodać kurs po 23:00.");
      return;
    }
    setTimes((prev) => ({ ...prev, [day]: [...new Set([...prev[day], value])].sort() }));
    setInputs((prev) => ({ ...prev, [day]: "" }));
    setError("");
  };

  const removeTime = (day, value) => {
    setTimes((prev) => ({ ...prev, [day]: prev[day].filter((item) => item !== value) }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const total = DAY_KEYS.reduce((sum, day) => sum + times[day].length, 0);

    if (!lineId) {
      setError("Wybierz linię.");
      return;
    }
    if (!brigade.trim()) {
      setError("Podaj numer brygady, np. 101-01.");
      return;
    }
    if (assignment.mode === "manual" && !vehicleId) {
      setError("Wybierz konkretny pojazd dla trybu ręcznego.");
      return;
    }
    if (assignment.mode === "model" && !String(assignment.model_filter || "").trim()) {
      setError("Wpisz model lub markę dopuszczoną na linii.");
      return;
    }
    const mix = (assignment.model_mix || []).filter(
      (entry) => String(entry.model || "").trim() && Number(entry.percent) > 0
    );
    if (assignment.mode === "percentage" && mix.length === 0) {
      setError("Dodaj co najmniej jeden model z udziałem procentowym.");
      return;
    }
    if (!total) {
      setError("Dodaj przynajmniej jeden odjazd w tygodniu.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await base44.entities.Line.update(lineId, {
        assignment_mode: assignment.mode,
        model_filter: assignment.mode === "model" ? String(assignment.model_filter || "").trim() : "",
        model_mix:
          assignment.mode === "percentage"
            ? mix.map((entry) => ({ model: String(entry.model).trim(), percent: Number(entry.percent) }))
            : [],
      });

      const payload = {
        line_id: lineId,
        brigade: brigade.trim(),
        vehicle_id: assignment.mode === "manual" ? vehicleId : "",
        ...times,
      };

      const existing = editing?.id
        ? assignments.find((item) => item.id === editing.id)
        : assignment.mode === "manual"
          ? assignments.find((item) => item.vehicle_id === vehicleId)
          : assignments.find((item) => item.line_id === lineId && item.brigade === brigade.trim());

      if (existing) await base44.entities.Assignment.update(existing.id, payload);
      else await base44.entities.Assignment.create(payload);

      toast.success("Kursy zapisane");
      reset();
      onSaved?.();
    } catch {
      setError("Nie udało się zapisać kursów. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{editing ? "Edycja kursów" : "Nowe kursy"}</p>
          <h2 className="mt-1 font-display text-2xl leading-none">Brygada i rozkład</h2>
        </div>
        {editing && (
          <button type="button" onClick={onCancelEdit} aria-label="Anuluj edycję" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <select value={lineId} onChange={(event) => pickLine(event.target.value)} className={selectClass}>
          <option value="">Wybierz linię…</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.number} · {line.name || `Linia ${line.number}`} ({(line.stops || []).length} przyst.)
            </option>
          ))}
        </select>

        <Input
          value={brigade}
          onChange={(event) => setBrigade(event.target.value)}
          placeholder="Brygada / kurs, np. 101-01"
          className="h-10 font-mono text-[12.5px]"
        />
      </div>

      <div className="mt-3 rounded-xl border border-border/70 bg-secondary/30 p-2.5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Przydział taboru</p>
          {selectedLine?.number && (
            <span className="num text-[9.5px] text-muted-foreground">linia {selectedLine.number}</span>
          )}
        </div>
        {!lineId ? (
          <p className="mt-1.5 text-[10.5px] text-muted-foreground">Najpierw wybierz linię, aby ustawić przydział.</p>
        ) : (
          <div className="mt-2 space-y-2">
            <AssignmentModeEditor value={assignment} onChange={setAssignment} models={models} compact />
            {assignment.mode === "manual" && (
              <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className={selectClass}>
                <option value="">Wybierz pojazd…</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.fleet_number} · {vehicle.model || "Autobus"}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="eyebrow">Odjazdy z pętli początkowej</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DAY_KEYS.map((day) => (
            <div key={day} className="rounded-xl border border-border/70 bg-secondary/30 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">{DAY_LABELS[day]}</span>
                <span className="num text-[9.5px] text-muted-foreground">{times[day].length}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {times[day].length === 0 && <span className="text-[10px] text-muted-foreground">brak kursów</span>}
                {times[day].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => removeTime(day, value)}
                    title="Usuń odjazd"
                    className="num rounded-md bg-card px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-border transition-colors hover:text-destructive"
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1">
                <Input
                  type="time"
                  value={inputs[day]}
                  onChange={(event) => setInputs((prev) => ({ ...prev, [day]: event.target.value }))}
                  className="h-7 rounded-md px-1.5 text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => addTime(day)}
                  aria-label="Dodaj odjazd"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-[11.5px] font-medium text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Zapisuję…" : "Zapisz kursy"}
      </button>
    </form>
  );
}
