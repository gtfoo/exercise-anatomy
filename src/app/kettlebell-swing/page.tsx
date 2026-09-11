import ExerciseViewer from "@/components/ExerciseViewer";
import { kettlebellSwing } from "@/lib/exercises/kettlebell-swing";

export default function KettlebellSwingPage() {
  return <ExerciseViewer exercise={kettlebellSwing} />;
}
