import ExerciseViewer from "@/components/ExerciseViewer";
import { handstand } from "@/lib/exercises/handstand";

export default function HandstandPage() {
  return <ExerciseViewer exercise={handstand} />;
}
