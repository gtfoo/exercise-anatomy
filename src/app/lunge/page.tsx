import ExerciseViewer from "@/components/ExerciseViewer";
import { lunge } from "@/lib/exercises/lunge";

export default function LungePage() {
  return <ExerciseViewer exercise={lunge} />;
}
