import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

// O service worker (PWA) é gerado pela rota src/app/serwist/[path]/route.ts.
export default withSerwist(nextConfig);
