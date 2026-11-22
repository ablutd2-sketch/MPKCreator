import { createFileRoute } from "@tanstack/react-router";
import EditorGate from "@/components/builder/EditorGate";
import VehicleForm from "@/components/builder/VehicleForm";
import VehicleList from "@/components/builder/VehicleList";
import { useTransitData } from "@/lib/useTransitData";

export const Route = createFileRoute("/_site/builder/")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const { vehicles, lines, assignments, loading, reload } = useTransitData();

  return (
    <EditorGate>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
        <VehicleForm onSaved={reload} />
        <VehicleList
          vehicles={vehicles}
          lines={lines}
          assignments={assignments}
          loading={loading}
          onChanged={reload}
        />
      </div>
    </EditorGate>
  );
}
