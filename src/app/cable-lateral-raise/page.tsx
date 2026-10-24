import ExerciseViewer from "@/components/ExerciseViewer";
import { cableLateralRaise } from "@/lib/exercises/cable";

export default function CableLateralRaisePage() {
  return <ExerciseViewer exercise={cableLateralRaise} />;
}
