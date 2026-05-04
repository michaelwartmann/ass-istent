import { ExerciseForm } from "../exercise-form";

export default function NewExercisePage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Neue Übung
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Anlegen</h1>
      </div>
      <ExerciseForm mode="create" />
    </div>
  );
}
