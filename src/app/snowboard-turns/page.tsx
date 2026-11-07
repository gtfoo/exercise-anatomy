import ExerciseViewer from "@/components/ExerciseViewer";
import { snowboardTurns } from "@/lib/exercises/snowboarding";

export default function SnowboardTurnsPage() {
  return <ExerciseViewer exercise={snowboardTurns} />;
}
