import { Bus } from "lucide-react";
import { Image } from "@/components/ui/image";
import LineBadge from "@/components/LineBadge";
import { formatClock } from "@/lib/simulation";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="max-w-[62%] text-right text-[12px] font-medium leading-snug text-foreground">{value || "—"}</dd>
    </div>
  );
}

export default function VehiclePopup({ item }) {
  const { vehicle, line, state } = item;

  return (
    <div className="w-[248px] overflow-hidden bg-card">
      <div className="relative h-28 w-full overflow-hidden bg-primary">
        {vehicle.image_url ? (
          <Image src={vehicle.image_url} alt={vehicle.model || vehicle.fleet_number} className="h-28 w-full bg-white object-contain" fittingType="fit" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Bus className="h-9 w-9 text-white/70" strokeWidth={1.4} />
          </div>
        )}
        <LineBadge line={line} className="absolute left-2.5 top-2.5 shadow-sm" />
      </div>

      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold tracking-wide text-foreground">{vehicle.fleet_number}</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {state.directionLabel}
          </span>
        </div>
        <p className="mt-0.5 font-heading text-[13px] font-semibold leading-tight text-foreground">
          {vehicle.model || "Autobus"}
        </p>

        <dl className="mt-2.5 space-y-1.5 border-t border-border/70 pt-2.5">
          <Row label="Kierunek" value={state.direction || state.destination} />
          <Row label="Do" value={state.destination} />
          <Row label="Następny" value={state.nextStop} />
          <Row label="Odjazd" value={state.nextDeparture == null ? "—" : formatClock(state.nextDeparture)} />
        </dl>
      </div>
    </div>
  );
}
