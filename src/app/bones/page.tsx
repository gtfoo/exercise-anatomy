import ExerciseViewer from "@/components/ExerciseViewer";
import { bonesAtlas } from "@/lib/exercises/atlas";

export default function BonesPage() {
  return <ExerciseViewer exercise={bonesAtlas} />;
}
