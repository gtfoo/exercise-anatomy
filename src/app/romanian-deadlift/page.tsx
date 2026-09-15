import ExerciseViewer from "@/components/ExerciseViewer";
import { romanianDeadlift } from "@/lib/exercises/weights-more";

export default function RomanianDeadliftPage() {
  return <ExerciseViewer exercise={romanianDeadlift} />;
}
