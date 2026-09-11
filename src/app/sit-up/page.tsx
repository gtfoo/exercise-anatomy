import ExerciseViewer from "@/components/ExerciseViewer";
import { sitUp } from "@/lib/exercises/sit-up";

export default function SitUpPage() {
  return <ExerciseViewer exercise={sitUp} />;
}
