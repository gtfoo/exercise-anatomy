import ExerciseViewer from "@/components/ExerciseViewer";
import { cableCurl } from "@/lib/exercises/cable";

export default function CableCurlPage() {
  return <ExerciseViewer exercise={cableCurl} />;
}
