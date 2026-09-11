import ExerciseViewer from "@/components/ExerciseViewer";
import { bicepCurl } from "@/lib/exercises/bicep-curl";

export default function BicepCurlPage() {
  return <ExerciseViewer exercise={bicepCurl} />;
}
