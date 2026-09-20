"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The kneeling hip flexor stretch became the yoga low lunge (2026-09-20); the old address forwards to it. */
export default function HipFlexorStretchPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/low-lunge/");
  }, [router]);
  return (
    <main className="p-6 text-sm text-zinc-600">
      This page moved to <a className="underline" href="/low-lunge/">Low lunge</a>.
    </main>
  );
}
