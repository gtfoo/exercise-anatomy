import ExerciseViewer from "@/components/ExerciseViewer";
import { crowPose } from "@/lib/exercises/yoga";

export default function Page() {
  return <ExerciseViewer exercise={crowPose} />;
}
