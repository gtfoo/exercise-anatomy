import ExerciseViewer from "@/components/ExerciseViewer";
import { deadlift } from "@/lib/exercises/weights-more";

export default function DeadliftPage() {
  return <ExerciseViewer exercise={deadlift} />;
}
