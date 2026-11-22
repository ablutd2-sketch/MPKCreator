import { Bus } from "lucide-react";
import { Image } from "@/components/ui/image";
import LineBadge from "@/components/LineBadge";

export default function ActiveVehiclesPanel({ items = [], onSelect }) {
  if (!items.length) return null;

  return (
    <div className="absolute bottom-4 left-4 z-[600] hidden w-[248px] overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_26px_60px_-34px_rgba(18,26,43,0.75)] backdrop-blur-xl md:block">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
        <span className="eyebrow">W trasie</span>
        <span className="num text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <ul className="max-h-[236px] overflow-y-auto">
        {items.slice(0, 8).map((item) => (
          <li key={item.vehicle.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/70"
            >
              <span className="h-7 w-10 shrink-0 overflow-hidden rounded-lg bg-primary">
                {item.vehicle.image_url ? (
                  <Image src={item.vehicle.image_url} alt="" className="h-7 w-10 bg-white object-contain" fittingType="fit" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Bus className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <LineBadge line={item.line} size="sm" />
                  <span className="truncate font-mono text-[10px] font-medium text-foreground">
                    {item.vehicle.fleet_number}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <span className="truncate">{item.state.direction || item.state.destination}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
