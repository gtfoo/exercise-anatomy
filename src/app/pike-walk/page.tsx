import ExerciseViewer from "@/components/ExerciseViewer";
import { pikeWalk } from "@/lib/exercises/pike-walk";

export default function PikeWalkPage() {
  return <ExerciseViewer exercise={pikeWalk} />;
}
