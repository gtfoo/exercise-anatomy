import ExerciseViewer from "@/components/ExerciseViewer";
import { plank } from "@/lib/exercises/plank";

export default function Page() {
  return <ExerciseViewer exercise={plank} />;
}
