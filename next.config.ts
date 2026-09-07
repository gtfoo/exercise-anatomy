import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: no state, no API routes, no per-request work. Caddy serves
  // `out/` directly on the droplet, so the app costs the box no process at all.
  output: "export",
  turbopack: {
    // ~/Git is not a workspace, and a stray package-lock.json one level above
    // it makes Turbopack guess the wrong root. npm scripts always run from the
    // package root, so cwd is the app directory.
    root: process.cwd(),
  },
};

export default nextConfig;
