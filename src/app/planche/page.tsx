import ExerciseViewer from "@/components/ExerciseViewer";
import { planche } from "@/lib/exercises/planche";

export default function PlanchePage() {
  return <ExerciseViewer exercise={planche} />;
}
