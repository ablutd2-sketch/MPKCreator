import { useState } from "react";
import { Loader2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { wakeHungerValue, wakeThirstValue } from "@/lib/fatigue";
import { useSimulation } from "@/lib/SimulationContext";
import { useTransitData } from "@/lib/useTransitData";

export default function FleetCareButton({ vehicles = [] }) {
  const { simMinutes } = useSimulation();
  const { reload } = useTransitData();
  const [saving, setSaving] = useState(false);

  const refill = async () => {
    if (saving || !vehicles.length) return;
    setSaving(true);
    try {
      await base44.entities.Vehicle.bulkUpdate(
        vehicles.map((vehicle) => ({
          id: vehicle.id,
          hunger: wakeHungerValue(vehicle, simMinutes),
          thirst: wakeThirstValue(vehicle, simMinutes),
        }))
      );
      await reload();
      toast.success(`Uzupełniono zasoby · ${vehicles.length} pojazdów`);
    } catch {
      toast.error("Nie udało się uzupełnić zasobów.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button size="sm" onClick={refill} disabled={saving || !vehicles.length} className="gap-1.5">
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Utensils className="h-3.5 w-3.5" />}
      Uzupełnij zasoby taboru
    </Button>
  );
}
