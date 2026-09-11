import ExerciseViewer from "@/components/ExerciseViewer";
import { pushUp } from "@/lib/exercises/push-up";

export default function PushUpPage() {
  return <ExerciseViewer exercise={pushUp} />;
}
