import ExerciseViewer from "@/components/ExerciseViewer";
import { tennisServe } from "@/lib/exercises/racket-sports";

export default function TennisServePage() {
  return <ExerciseViewer exercise={tennisServe} />;
}
