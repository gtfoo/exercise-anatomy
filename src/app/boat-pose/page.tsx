import ExerciseViewer from "@/components/ExerciseViewer";
import { boatPose } from "@/lib/exercises/yoga";

export default function Page() {
  return <ExerciseViewer exercise={boatPose} />;
}
