import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { DAY_CHIPS, DAY_KEYS } from "@/lib/simulation";
import { ASSIGNMENT_MODE_LABELS } from "@/lib/lineUtils";
import LineBadge from "@/components/LineBadge";

export default function CourseList({ assignments, vehicles, lines, onEdit, onDeleted }) {
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const lineById = new Map(lines.map((line) => [line.id, line]));

  const remove = async (assignment) => {
    if (!window.confirm(`Usunąć kursy brygady ${assignment.brigade}?`)) return;
    try {
      await base44.entities.Assignment.delete(assignment.id);
      toast.success("Kursy usunięte");
      onDeleted?.();
    } catch {
      toast.error("Nie udało się usunąć kursów.");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="eyebrow">Rozkłady</p>
        <span className="num text-[11px] text-muted-foreground">{assignments.length}</span>
      </div>

      {assignments.length === 0 ? (
        <div className="surface px-5 py-10 text-center">
          <p className="text-[13px] text-muted-foreground">Brak przypisanych kursów. Dodaj pierwszą brygadę po lewej.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => {
            const vehicle = vehicleById.get(assignment.vehicle_id);
            const line = lineById.get(assignment.line_id);
            const total = DAY_KEYS.reduce((sum, day) => sum + (assignment[day]?.length || 0), 0);

            return (
              <li key={assignment.id} className="surface p-3.5">
                <div className="flex items-start gap-3">
                  <LineBadge line={line} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] font-semibold">{assignment.brigade}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                      {vehicle
                        ? `${vehicle.fleet_number} · ${vehicle.model || "Autobus"}`
                        : `Przydział automatyczny · ${ASSIGNMENT_MODE_LABELS[line?.assignment_mode || "manual"]}`}{" "}
                      · {total} odjazdów
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Edytuj kursy"
                      onClick={() => onEdit(assignment)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Usuń kursy"
                      onClick={() => remove(assignment)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {DAY_KEYS.map((day) => {
                    const count = assignment[day]?.length || 0;
                    return (
                      <span
                        key={day}
                        className={
                          count
                            ? "rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                            : "rounded-md border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground/60"
                        }
                      >
                        {DAY_CHIPS[day]} {count}
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
