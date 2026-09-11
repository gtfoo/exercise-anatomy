import ExerciseViewer from "@/components/ExerciseViewer";
import { squat } from "@/lib/exercises/squat";

export default function SquatPage() {
  return <ExerciseViewer exercise={squat} />;
}
