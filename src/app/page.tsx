import ExerciseViewer from "@/components/ExerciseViewer";
import { squat } from "@/lib/exercises/squat";

export default function Home() {
  return <ExerciseViewer exercise={squat} />;
}
