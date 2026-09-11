import ExerciseViewer from "@/components/ExerciseViewer";
import { cleanAndJerk } from "@/lib/exercises/clean-and-jerk";

export default function CleanAndJerkPage() {
  return <ExerciseViewer exercise={cleanAndJerk} />;
}
