import LineBadge from "@/components/LineBadge";
import StatBar from "@/components/fleet/StatBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { floorMeta } from "@/lib/vehicleFloor";

export default function VehicleInfoDialog({ item, onClose }) {
  const vehicle = item?.vehicle;

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
              <StatBar label="Głód" value={item.stat?.hunger} />
              <StatBar label="Zadowolenie" value={item.stat?.satisfaction} invert />
              <StatBar label="Zmęczenie" value={item.stat?.fatigue} />
              <StatBar label="Pragnienie" value={item.stat?.thirst} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
