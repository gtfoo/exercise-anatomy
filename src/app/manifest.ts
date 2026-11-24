import type { MetadataRoute } from "next";
import { STUDIO } from "@/lib/palette";

// Built once into out/manifest.webmanifest: the site is a static export, so the route must be static.
export const dynamic = "force-static";

/** The web app manifest: what a phone's "Add to Home Screen" installs (icons from tools/icon/make_icons.mjs). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Exercise anatomy",
    short_name: "Anatomy",
    description: "Which muscles work, and when, through a movement, shown on a 3D figure.",
    start_url: "/",
    display: "standalone",
    background_color: STUDIO,
    theme_color: STUDIO,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // The muscle sits inside the central 80% circle, so a launcher's mask never cuts it.
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
