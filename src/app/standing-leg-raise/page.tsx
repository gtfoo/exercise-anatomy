import ExerciseViewer from "@/components/ExerciseViewer";
import { standingLegRaise } from "@/lib/exercises/standing-leg-raise";

export default function StandingLegRaisePage() {
  return <ExerciseViewer exercise={standingLegRaise} />;
}
