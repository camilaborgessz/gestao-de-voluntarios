import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ["@prisma/client"],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
