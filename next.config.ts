import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["http://[IP_ADDRESS]", "http://localhost:3000", "*"],
};

// O service worker (PWA) é gerado pela rota src/app/serwist/[path]/route.ts.
export default withSerwist(nextConfig);