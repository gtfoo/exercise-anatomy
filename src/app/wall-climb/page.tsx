import ExerciseViewer from "@/components/ExerciseViewer";
import { wallClimb } from "@/lib/exercises/wall-climb";

export default function WallClimbPage() {
  return <ExerciseViewer exercise={wallClimb} />;
}
