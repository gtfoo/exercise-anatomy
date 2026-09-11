import ExerciseViewer from "@/components/ExerciseViewer";
import { breaststroke } from "@/lib/exercises/breaststroke";

export default function BreaststrokePage() {
  return <ExerciseViewer exercise={breaststroke} />;
}
