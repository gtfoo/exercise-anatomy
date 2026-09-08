import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: no state, no API routes, no per-request work. Caddy serves
  // `out/` directly on the droplet, so the app costs the box no process at all.
  output: "export",
  // Routes export as <route>/index.html, which a plain file server resolves for
  // both /pull-up and /pull-up/. Without it the export is pull-up.html and Caddy
  // answers 404 to the route the panel links to.
  trailingSlash: true,
  turbopack: {
    // ~/Git is not a workspace, and a stray package-lock.json one level above
    // it makes Turbopack guess the wrong root. npm scripts always run from the
    // package root, so cwd is the app directory.
    root: process.cwd(),
  },
};

export default nextConfig;
