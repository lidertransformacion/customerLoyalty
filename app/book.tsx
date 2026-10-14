import { router } from "expo-router";

import { Book } from "@/src/ui/book";
import { Frame } from "@/src/ui/frame";

export default function BookScreen() {
  return (
    <Frame dark>
      <Book onClose={() => router.back()} />
    </Frame>
  );
}
