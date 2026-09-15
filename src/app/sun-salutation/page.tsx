import ExerciseViewer from "@/components/ExerciseViewer";
import { sunSalutation } from "@/lib/exercises/sun-salutation";

export default function SunSalutationPage() {
  return <ExerciseViewer exercise={sunSalutation} />;
}
