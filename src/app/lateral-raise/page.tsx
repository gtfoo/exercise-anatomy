import ExerciseViewer from "@/components/ExerciseViewer";
import { lateralRaise } from "@/lib/exercises/lateral-raise";

export default function LateralRaisePage() {
  return <ExerciseViewer exercise={lateralRaise} />;
}
