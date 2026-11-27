import { useEffect, useState } from "react";
import { Apple, Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import LineBadge from "@/components/LineBadge";
import StatBar from "@/components/fleet/StatBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { wakeHungerValue, wakeThirstValue } from "@/lib/fatigue";
import { useSimulation } from "@/lib/SimulationContext";
import { useTransitData } from "@/lib/useTransitData";
import { floorMeta } from "@/lib/vehicleFloor";

export default function VehicleInfoDialog({ item, onClose }) {
  const vehicle = item?.vehicle;
  const { simMinutes } = useSimulation();
  const { reload } = useTransitData();
  const [busy, setBusy] = useState(null);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    setOverrides({});
  }, [vehicle?.id]);

  const act = async (kind) => {
    if (!vehicle || busy) return;
    setBusy(kind);
    try {
      const patch =
        kind === "feed"
          ? { hunger: wakeHungerValue(vehicle, simMinutes) }
          : { thirst: wakeThirstValue(vehicle, simMinutes) };
      await base44.entities.Vehicle.update(vehicle.id, patch);
      setOverrides((prev) => ({ ...prev, [kind === "feed" ? "hunger" : "thirst"]: 0 }));
      await reload();
    } catch {
      toast.error("Nie udało się zapisać.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={Boolean(vehicle)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg leading-none">{vehicle?.fleet_number}</DialogTitle>
        </DialogHeader>

        {vehicle && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              {item.line && <LineBadge line={item.line} size="sm" />}
              <span className="text-foreground">{vehicle.model || "bez modelu"}</span>
            </div>

            <div className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
              <span>{vehicle.kind === "tram" ? "Tramwaj" : "Autobus"}</span>
              <span>·</span>
              <span>{floorMeta(vehicle.floor).label}</span>
              {item.brigade && (
                <>
                  <span>·</span>
                  <span className="num">{item.brigade}</span>
                </>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <StatBar label="Głód" value={overrides.hunger ?? item.stat?.hunger} />
              <StatBar label="Zadowolenie" value={item.stat?.satisfaction} invert />
              <StatBar label="Zmęczenie" value={item.stat?.fatigue} />
              <StatBar label="Pragnienie" value={overrides.thirst ?? item.stat?.thirst} />
            </div>

            <div className="flex gap-2 border-t border-border pt-3">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => act("feed")} disabled={Boolean(busy)}>
                {busy === "feed" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Apple className="mr-1.5 h-3.5 w-3.5" />}
                Nakarm
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => act("drink")} disabled={Boolean(busy)}>
                {busy === "drink" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Droplets className="mr-1.5 h-3.5 w-3.5" />}
                Napój
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
