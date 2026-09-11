import ExerciseViewer from "@/components/ExerciseViewer";
import { wheelPose } from "@/lib/exercises/yoga";

export default function Page() {
  return <ExerciseViewer exercise={wheelPose} />;
}
