import { useId } from "react";
import { Percent, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_MODE_LABELS } from "@/lib/lineUtils";

const MODES = ["manual", "model", "percentage"];

export default function AssignmentModeEditor({ value, onChange, models = [], vehicles = [], compact = false }) {
  const listId = useId();
  const mode = value?.mode || "manual";
  const modelFilter = value?.model_filter || "";
  const mix = Array.isArray(value?.model_mix) ? value.model_mix : [];
  const manualVehicles = Array.isArray(value?.manual_vehicles) ? value.manual_vehicles : [];
  const patch = (changes) =>
    onChange({ mode, model_filter: modelFilter, model_mix: mix, manual_vehicles: manualVehicles, ...changes });
  const toggleVehicle = (id) =>
    patch({
      manual_vehicles: manualVehicles.includes(id)
        ? manualVehicles.filter((item) => item !== id)
        : [...manualVehicles, id],
    });
  const total = mix.reduce((sum, row) => sum + (Number(row.percent) || 0), 0);

  const setRow = (index, changes) => {
    patch({ model_mix: mix.map((row, i) => (i === index ? { ...row, ...changes } : row)) });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        {MODES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => patch({ mode: option })}
            className={cn(
              "rounded-lg border px-1.5 py-1.5 text-[10px] font-semibold leading-tight transition-colors",
              mode === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {ASSIGNMENT_MODE_LABELS[option]}
          </button>
        ))}
      </div>

      {mode === "manual" && (
        <div className="space-y-1">
          {vehicles.length === 0 ? (
            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
              Tabor jest pusty — dodaj pojazdy w zakładce Pojazdy.
            </p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {vehicles.map((vehicle) => {
                const order = manualVehicles.indexOf(vehicle.id);
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
          {!compact && (
            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
              Wybrane wozy obsłużą brygady tej linii w podanej kolejności.
            </p>
          )}
        </div>
      )}

      {mode === "model" && (
        <div>
          <Input
            value={modelFilter}
            onChange={(event) => patch({ model_filter: event.target.value })}
            list={listId}
            placeholder="np. Solaris lub Solaris Urbino 12"
            className="h-9 text-[12px]"
          />
          <datalist id={listId}>
            {models.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Na linię wyjeżdżają wyłącznie wolne wozy zawierające tę nazwę w modelu.
          </p>
        </div>
      )}

      {mode === "percentage" && (
        <div className="space-y-1.5">
          {mix.length === 0 && <p className="text-[10.5px] text-muted-foreground">Dodaj modele i ich udziały procentowe.</p>}
          {mix.map((row, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Input
                value={row.model || ""}
                onChange={(event) => setRow(index, { model: event.target.value })}
                list={listId}
                placeholder="Model"
                className="h-8 flex-1 text-[11.5px]"
              />
              <div className="relative w-[68px] shrink-0">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={row.percent ?? 0}
                  onChange={(event) => setRow(index, { percent: Number(event.target.value) })}
                  className="num h-8 pr-4 text-[11.5px]"
                />
                <Percent className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              </div>
              <button
                type="button"
                aria-label="Usuń udział"
                onClick={() => patch({ model_mix: mix.filter((_, i) => i !== index) })}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => patch({ model_mix: [...mix, { model: "", percent: 0 }] })}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary"
            >
              <Plus className="h-3 w-3" /> Dodaj model
            </button>
            <span
              className={cn(
                "num text-[10px] font-semibold",
                Math.round(total) === 100 ? "text-emerald-600" : "text-amber-600"
              )}
            >
              suma {Math.round(total)}%
            </span>
          </div>
          {!compact && (
            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
              System dobiera wolne wozy z taboru według tych udziałów przy uruchamianiu brygad.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
