import ExerciseViewer from "@/components/ExerciseViewer";
import { chairPose } from "@/lib/exercises/yoga-more";

export default function ChairPosePage() {
  return <ExerciseViewer exercise={chairPose} />;
}
