import ExerciseViewer from "@/components/ExerciseViewer";
import { catCow } from "@/lib/exercises/cat-cow";

export default function CatCowPage() {
  return <ExerciseViewer exercise={catCow} />;
}
