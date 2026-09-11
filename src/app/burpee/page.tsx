import ExerciseViewer from "@/components/ExerciseViewer";
import { burpee } from "@/lib/exercises/burpee";

export default function BurpeePage() {
  return <ExerciseViewer exercise={burpee} />;
}
