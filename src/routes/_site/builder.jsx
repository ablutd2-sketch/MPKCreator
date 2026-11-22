import { Outlet, createFileRoute } from "@tanstack/react-router";
import BuilderNav from "@/components/builder/BuilderNav";

export const Route = createFileRoute("/_site/builder")({
  head: () => ({
    meta: [
      { title: "Kreator tras i kursów · BusTracker PL" },
      {
        name: "description",
        content: "Dodaj pojazdy, ułóż trasy z przystankami i rozpisz kursy wahadłowe na cały tydzień.",
      },
    ],
  }),
  component: BuilderLayout,
});

function BuilderLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6">
        <p className="eyebrow">Kreator</p>
        <h1 className="mt-1.5 font-display text-3xl leading-none sm:text-4xl">Trasy, pojazdy i kursy</h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Zbuduj flotę, ułóż przystanki na mapie i rozpisz odjazdy na każdy dzień tygodnia.
        </p>
      </div>

      <BuilderNav />

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
