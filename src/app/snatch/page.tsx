import ExerciseViewer from "@/components/ExerciseViewer";
import { snatch } from "@/lib/exercises/snatch";

export default function SnatchPage() {
  return <ExerciseViewer exercise={snatch} />;
}
