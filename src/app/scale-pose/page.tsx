import ExerciseViewer from "@/components/ExerciseViewer";
import { scalePose } from "@/lib/exercises/yoga-more";

export default function ScalePosePage() {
  return <ExerciseViewer exercise={scalePose} />;
}
