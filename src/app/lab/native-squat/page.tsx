import ExerciseViewer from "@/components/ExerciseViewer";
import { squatNative } from "@/lib/exercises/squat-native";

export default function NativeSquatLabPage() {
  return <ExerciseViewer exercise={squatNative} />;
}
