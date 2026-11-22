import { Bus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import LineBadge from "@/components/LineBadge";

export default function VehicleList({ vehicles, lines = [], assignments = [], loading, onChanged }) {
  const lineByVehicle = new Map();
  assignments.forEach((assignment) => {
    if (!assignment?.vehicle_id) return;
    const line = lines.find((item) => item.id === assignment.line_id);
    if (line) lineByVehicle.set(assignment.vehicle_id, line);
  });

  const remove = async (vehicle) => {
    if (!window.confirm(`Usunąć pojazd ${vehicle.fleet_number}?`)) return;
    try {
      await base44.entities.Vehicle.delete(vehicle.id);
      toast.success("Pojazd usunięty");
      onChanged?.();
    } catch {
      toast.error("Nie udało się usunąć pojazdu.");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="eyebrow">Flota</p>
        <span className="num text-[11px] text-muted-foreground">{vehicles.length} pojazdów</span>
      </div>

      {loading ? (
        <div className="surface h-40 animate-pulse" />
      ) : vehicles.length === 0 ? (
        <div className="surface flex flex-col items-center px-6 py-10 text-center">
          <Bus className="h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-[13px] text-muted-foreground">Nie masz jeszcze żadnego pojazdu.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="surface flex items-center gap-3 p-3">
              <div
                className="shrink-0 overflow-hidden rounded-lg bg-primary"
                style={{ width: "96px", height: "48px" }}
              >
                {vehicle.image_url ? (
                  <Image
                    src={vehicle.image_url}
                    alt=""
                    className="block object-contain"
                    style={{ width: "100%", height: "100%", maxWidth: "100%", objectFit: "contain" }}
                    fittingType="fill"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Bus className="h-5 w-5 text-white/70" strokeWidth={1.6} />
                  </span>
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[12px] font-semibold">{vehicle.fleet_number}</span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="truncate text-[12px] text-muted-foreground">{vehicle.model || "Autobus"}</span>
                  {lineByVehicle.get(vehicle.id) ? (
                    <LineBadge line={lineByVehicle.get(vehicle.id)} size="sm" />
                  ) : (
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">bez linii</span>
                  )}
                </span>
              </span>
              <button
                type="button"
                aria-label="Usuń pojazd"
                onClick={() => remove(vehicle)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
