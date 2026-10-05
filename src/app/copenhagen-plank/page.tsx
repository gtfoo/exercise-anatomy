import ExerciseViewer from "@/components/ExerciseViewer";
import { copenhagenPlank } from "@/lib/exercises/copenhagen-plank";

export default function CopenhagenPlankPage() {
  return <ExerciseViewer exercise={copenhagenPlank} />;
}
