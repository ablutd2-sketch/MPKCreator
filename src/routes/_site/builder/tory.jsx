import { createFileRoute } from "@tanstack/react-router";
import EditorGate from "@/components/builder/EditorGate";
import TrackEditor from "@/components/builder/TrackEditor";

export const Route = createFileRoute("/_site/builder/tory")({
  head: () => ({
    meta: [
      { title: "Tory · BusTracker PL" },
      { name: "description", content: "Rysowanie torowiska tramwajowego punkt po punkcie, bez prowadzenia po drogach." },
    ],
  }),
  component: TracksPage,
});

function TracksPage() {
  return (
    <EditorGate>
      <div className="mb-4">
        <p className="eyebrow">Torowisko</p>
        <h1 className="mt-1.5 font-display text-2xl leading-none">Rysowanie torów</h1>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
          Tory rysujesz sam, punkt po punkcie — nie są liczone po drogach. Jeden tor obsługuje oba kierunki jazdy.
        </p>
      </div>
      <TrackEditor />
    </EditorGate>
  );
}
