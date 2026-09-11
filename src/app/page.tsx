import ExerciseViewer from "@/components/ExerciseViewer";
import { atlas } from "@/lib/exercises/atlas";

export default function HomePage() {
  return <ExerciseViewer exercise={atlas} />;
}
