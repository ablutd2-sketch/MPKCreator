import { createFileRoute } from "@tanstack/react-router";
import LinesVehiclesGrid from "@/components/fleet/LinesVehiclesGrid";
import { useTransitData } from "@/lib/useTransitData";

export const Route = createFileRoute("/_site/linie")({
  head: () => ({
    meta: [
      { title: "Pojazdy na liniach · BusTracker PL" },
      {
        name: "description",
        content: "Wszystkie linie i pojazdy, które je obsługują — z podziałem na typ podłogi.",
      },
    ],
  }),
  component: LinesPage,
});

function LinesPage() {
  const { vehicles, lines, assignments, loading } = useTransitData();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <p className="eyebrow">Tabor</p>
      <h1 className="mt-1.5 font-display text-3xl leading-none sm:text-4xl">Pojazdy na liniach</h1>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
        Każda linia w osobnej kolumnie, a pod nią wozy, które ją obsługują. Kolor kafla pokazuje typ podłogi.
      </p>

      <div className="mt-6">
        {loading ? (
          <div className="surface h-64 animate-pulse" />
        ) : (
          <LinesVehiclesGrid vehicles={vehicles} lines={lines} assignments={assignments} />
        )}
      </div>
    </div>
  );
}
