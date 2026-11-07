import ExerciseViewer from "@/components/ExerciseViewer";
import { parallelTurns } from "@/lib/exercises/skiing";

export default function ParallelTurnsPage() {
  return <ExerciseViewer exercise={parallelTurns} />;
}
