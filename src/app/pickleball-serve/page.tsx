import ExerciseViewer from "@/components/ExerciseViewer";
import { pickleballServe } from "@/lib/exercises/racket-sports";

export default function PickleballServePage() {
  return <ExerciseViewer exercise={pickleballServe} />;
}
