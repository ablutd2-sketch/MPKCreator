import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import OffRouteRow from "@/components/map/OffRouteRow";

export default function OffRouteAlarm({ alerts = [] }) {
  const [dismissed, setDismissed] = useState(0);
  if (!alerts.length || alerts.length <= dismissed) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-[700] w-[min(94vw,460px)] -translate-x-1/2">
      <div className="pointer-events-auto overflow-hidden rounded-xl border border-destructive/50 bg-card/97 shadow-[0_24px_50px_-24px_rgba(18,26,43,0.6)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-destructive" />
          <p className="flex-1 text-[10px] font-bold uppercase tracking-[0.14em] text-destructive">
            Alarm · zjazd z trasy ({alerts.length})
          </p>
          <button
            type="button"
            onClick={() => setDismissed(alerts.length)}
            aria-label="Zamknij alarm"
            className="rounded-md p-0.5 text-destructive/80 transition-colors hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[190px] divide-y divide-border/60 overflow-y-auto">
          {alerts.map((alert) => (
            <OffRouteRow key={alert.vehicle.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}
