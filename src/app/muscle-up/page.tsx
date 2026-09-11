import ExerciseViewer from "@/components/ExerciseViewer";
import { muscleUp } from "@/lib/exercises/muscle-up";

export default function MuscleUpPage() {
  return <ExerciseViewer exercise={muscleUp} />;
}
