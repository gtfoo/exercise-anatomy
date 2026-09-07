import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // ~/Git is not a workspace, and a stray package-lock.json one level above
    // it makes Turbopack guess the wrong root. npm scripts always run from the
    // package root, so cwd is the app directory.
    root: process.cwd(),
  },
};

export default nextConfig;
