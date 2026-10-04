import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

/** Versão do precache: o commit atual, para o service worker trocar a cada publicação. */
const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
