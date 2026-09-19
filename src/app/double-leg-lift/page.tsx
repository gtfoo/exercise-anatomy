import ExerciseViewer from "@/components/ExerciseViewer";
import { doubleLegLift } from "@/lib/exercises/core-sweat";

export default function DoubleLegLiftPage() {
  return <ExerciseViewer exercise={doubleLegLift} />;
}
