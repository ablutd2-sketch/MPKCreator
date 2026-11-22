import { ArrowUpRight, Bus, Play, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Image } from "@/components/ui/image";
import LineBadge from "@/components/LineBadge";
import { formatLastActivity } from "@/lib/simulation";
import { cn } from "@/lib/utils";

function Th({ children, className }) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

function EmptyState() {
  return (
    <div className="surface flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
        <Bus className="h-5 w-5 text-muted-foreground" />
      </span>
      <h3 className="mt-4 font-display text-xl">Tabor jest jeszcze pusty</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        Dodaj pierwszy autobus w kreatorze, aby zobaczyć go w wykazie i uruchomić symulację.
      </p>
      <Link
        to="/builder"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground"
      >
        Dodaj pojazd <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function FleetTable({
  rows,
  favorites,
  onToggleFavorite,
  onOpenVehicle,
  onQuickStart,
  secondsAgo,
  dayKey,
}) {
  if (!rows.length) return <EmptyState />;

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-secondary/50 text-left">
              <Th className="w-[96px]">Rysunek</Th>
              <Th>ID / Numer taborowy</Th>
              <Th>Model</Th>
              <Th className="w-[74px]">Linia</Th>
              <Th>Kierunek</Th>
              <Th>Ostatnia aktywność</Th>
              <Th className="w-[150px]">Brygada / Kurs</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isFavorite = favorites.includes(row.vehicle.id);
              return (
                <tr
                  key={row.vehicle.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <Td>
                    <div className="overflow-hidden rounded-lg bg-primary" style={{ width: "96px", height: "48px" }}>
                      {row.vehicle.image_url ? (
                        <Image
                          src={row.vehicle.image_url}
                          alt=""
                          className="block object-contain"
                          style={{ width: "100%", height: "100%", maxWidth: "100%", objectFit: "contain" }}
                          fittingType="fill"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Bus className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                        </span>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <span className="flex items-center gap-2">
                      {row.state && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                      <button
                        type="button"
                        onClick={() => onOpenVehicle(row.vehicle.id)}
                        className="font-mono text-[12px] font-semibold text-foreground hover:text-primary"
                      >
                        {row.vehicle.fleet_number}
                      </button>
                      <button
                        type="button"
                        aria-label="Dodaj do ulubionych"
                        onClick={() => onToggleFavorite(row.vehicle.id)}
                        className="text-muted-foreground transition-colors hover:text-amber-500"
                      >
                        <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-amber-400 text-amber-400")} />
                      </button>
                    </span>
                  </Td>

                  <Td className="text-[13px] text-foreground">{row.vehicle.model || "—"}</Td>

                  <Td>
                    {row.state && row.line ? (
                      <LineBadge line={row.line} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>

                  <Td className="max-w-[240px]">
                    {row.state ? (
                      <>
                        <span className="block truncate text-[12.5px] font-medium text-foreground">{row.state.direction}</span>
                        <span className="block truncate text-[10.5px] text-muted-foreground">
                          {row.state.directionLabel} · następny: {row.state.nextStop}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>

                  <Td>
                    {row.state ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {secondsAgo} s temu
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">
                        {formatLastActivity(row.activity, dayKey)}
                      </span>
                    )}
                  </Td>

                  <Td>
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenVehicle(row.vehicle.id)}
                        className="num rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {row.assignment?.brigade || "—"}
                      </button>
                      {row.assignment && (
                        <button
                          type="button"
                          aria-label="Uruchom symulację"
                          onClick={() => onQuickStart(row)}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
