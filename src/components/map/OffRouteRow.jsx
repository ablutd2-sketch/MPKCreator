import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import LineBadge from "@/components/LineBadge";
import ReserveBusDialog from "@/components/map/ReserveBusDialog";
import { reversePlace } from "@/lib/server-fns";

export default function OffRouteRow({ alert }) {
  const [place, setPlace] = useState(null);
  const reverse = useServerFn(reversePlace);
  const key = `${alert.lat.toFixed(3)},${alert.lng.toFixed(3)}`;

  useEffect(() => {
    let cancelled = false;
    setPlace(null);
    reverse({ data: { lat: alert.lat, lng: alert.lng } })
      .then((result) => {
        if (!cancelled) setPlace(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, reverse]);

  const distance =
    alert.distanceM >= 1000
      ? `${(alert.distanceM / 1000).toFixed(1)} km`
      : `${Math.round(alert.distanceM)} m`;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5">
      <LineBadge line={alert.line} size="sm" />
      <span className="num shrink-0 text-[11px] font-semibold text-foreground">
        {alert.vehicle.fleet_number}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-destructive">
        {place ? `jest teraz w: ${place.name}` : "zjechał z trasy"}
        <span className="text-muted-foreground"> · {distance} od trasy</span>
      </span>
      <ReserveBusDialog alert={alert} />
    </div>
  );
}
