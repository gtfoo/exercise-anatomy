import ExerciseViewer from "@/components/ExerciseViewer";
import { crabWalk } from "@/lib/exercises/crab-walk";

export default function CrabWalkPage() {
  return <ExerciseViewer exercise={crabWalk} />;
}
