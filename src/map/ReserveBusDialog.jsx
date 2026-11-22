import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Bus } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LineBadge from "@/components/LineBadge";
import { useTransitData } from "@/lib/useTransitData";
import { cn } from "@/lib/utils";

const PENALTIES = [5, 10, 15];

export default function ReserveBusDialog({ alert }) {
  const [open, setOpen] = useState(false);
  const [penalty, setPenalty] = useState(5);
  const [picked, setPicked] = useState("");
  const [saving, setSaving] = useState(false);
  const { vehicles, lines, assignments, reload } = useTransitData();

  const line = useMemo(
    () => (lines || []).find((item) => item.id === alert.line?.id) || alert.line,
    [lines, alert.line]
  );
  const terminal = line?.stops?.[line.stops.length - 1];

  const reserve = useMemo(() => {
    const busy = new Set();
    (assignments || []).forEach((item) => item.vehicle_id && busy.add(item.vehicle_id));
    (lines || []).forEach((item) => (item.manual_vehicles || []).forEach((id) => busy.add(id)));
    return (vehicles || []).filter((vehicle) => !busy.has(vehicle.id));
  }, [vehicles, lines, assignments]);

  const confirm = async (vehicleId) => {
    if (!line?.id || saving) return;
    setSaving(true);
    try {
      const current = Array.isArray(line.manual_vehicles) ? line.manual_vehicles : [];
      const next = current.filter((id) => id !== alert.vehicle.id);
      if (vehicleId && !next.includes(vehicleId)) next.push(vehicleId);
      await base44.entities.Line.update(line.id, { manual_vehicles: next });

      if (terminal) {
        const page = await base44.entities.LivePosition.filter(
          { fleet_number: alert.vehicle.fleet_number },
          { limit: 1 }
        );
        const record = (page?.items || [])[0];
        if (record) {
          await base44.entities.LivePosition.update(record.id, {
            lat: Number(terminal.lat),
            lng: Number(terminal.lng),
            next_stop: terminal.name || "Pętla",
          });
        }
      }

      await reload();
      const substitute = reserve.find((vehicle) => vehicle.id === vehicleId);
      toast.success(`Kara ${penalty} min postoju bez linii`, {
        description: substitute
          ? `Na linię ${line.number} podstawiono ${substitute.fleet_number}`
          : `${alert.vehicle.fleet_number} wrócił na pętlę`,
      });
      setOpen(false);
    } catch (error) {
      toast.error("Nie udało się wykonać podmiany");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-md bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black/80"
        >
          Rezerwa
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <LineBadge line={line} size="sm" />
            Podmiana · {alert.vehicle.fleet_number}
          </DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed">
            Autobus zjechał z trasy o {Math.round(alert.distanceM / 100) / 10} km. Ustaw karę, wróć na pętlę
            i podstaw wóz z rezerwy na linię {line?.number}.
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="eyebrow">Postój bez linii (kara)</p>
          <div className="mt-1.5 flex gap-1.5">
            {PENALTIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPenalty(value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                  penalty === value
                    ? "border-black bg-black text-white"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {value} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Autobus z rezerwy</p>
          <div className="mt-1.5 max-h-[190px] space-y-1 overflow-y-auto">
            {reserve.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-2.5 py-2 text-[11px] text-muted-foreground">
                Brak wolnych autobusów w rezerwie.
              </p>
            )}
            {reserve.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setPicked(vehicle.id === picked ? "" : vehicle.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
                  picked === vehicle.id
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <Bus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="num text-[11.5px] font-semibold">{vehicle.fleet_number}</span>
                <span className="truncate text-[11px] text-muted-foreground">{vehicle.model || "—"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => confirm("")}
            disabled={saving}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-[11.5px] font-semibold text-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Teleport na pętlę
          </button>
          <button
            type="button"
            onClick={() => confirm(picked)}
            disabled={saving || !picked}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-black text-[11.5px] font-semibold text-white disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bus className="h-3.5 w-3.5" />}
            Podstaw z rezerwy
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
