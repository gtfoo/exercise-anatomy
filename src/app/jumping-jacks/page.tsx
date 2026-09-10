import ExerciseViewer from "@/components/ExerciseViewer";
import { jumpingJacks } from "@/lib/exercises/jumping-jacks";

export default function JumpingJacksPage() {
  return <ExerciseViewer exercise={jumpingJacks} />;
}
