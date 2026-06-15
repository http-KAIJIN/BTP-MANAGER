import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * Resolve the Turbopack project root.
 *
 * - Local monorepo: this package lives in an npm workspace, so shared deps hoist
 *   to the repo-root node_modules. Turbopack must treat the repo root as the
 *   project root to resolve them (frontend/node_modules is still covered).
 * - Container build (frontend/Dockerfile): only this dir is copied and deps are
 *   installed locally into ./node_modules, so the cwd is the correct root.
 *
 * We detect the monorepo case by checking whether the parent declares workspaces.
 */
function resolveTurbopackRoot(): string {
  const cwd = process.cwd();
  const parent = path.resolve(cwd, "..");
  try {
    const parentPkg = path.join(parent, "package.json");
    if (fs.existsSync(parentPkg)) {
      const pkg = JSON.parse(fs.readFileSync(parentPkg, "utf8"));
      if (pkg.workspaces) return parent;
    }
  } catch {
    /* fall through to cwd */
  }
  return cwd;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: resolveTurbopackRoot(),
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
