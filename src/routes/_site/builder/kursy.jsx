import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import CourseForm from "@/components/builder/CourseForm";
import CourseList from "@/components/builder/CourseList";
import EditorGate from "@/components/builder/EditorGate";
import TaktGenerator from "@/components/builder/TaktGenerator";
import { useTransitData } from "@/lib/useTransitData";

export const Route = createFileRoute("/_site/builder/kursy")({
  component: CoursesPage,
});

function CoursesPage() {
  const { vehicles, lines, assignments, loading, reload } = useTransitData();
  const [editing, setEditing] = useState(null);

  return (
    <EditorGate>
      {loading ? (
        <div className="surface h-80 animate-pulse" />
      ) : (
        <div className="space-y-5">
          <TaktGenerator lines={lines} vehicles={vehicles} assignments={assignments} onGenerated={reload} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
            <CourseForm
              vehicles={vehicles}
              lines={lines}
              assignments={assignments}
              editing={editing}
              onSaved={() => {
                setEditing(null);
                reload();
              }}
              onCancelEdit={() => setEditing(null)}
            />
            <CourseList
              assignments={assignments}
              vehicles={vehicles}
              lines={lines}
              onEdit={setEditing}
              onDeleted={reload}
            />
          </div>
        </div>
      )}
    </EditorGate>
  );
}
