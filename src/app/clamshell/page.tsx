import ExerciseViewer from "@/components/ExerciseViewer";
import { clamshell } from "@/lib/exercises/clamshell";

export default function ClamshellPage() {
  return <ExerciseViewer exercise={clamshell} />;
}
