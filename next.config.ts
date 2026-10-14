import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

/** Endereço da API visto pelo servidor do Next (não pelo navegador). */
const API_INTERNA = (process.env.API_INTERNA || "http://localhost:3333").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Os testes de ponta a ponta usam um build próprio, sem mexer no .next do dia a dia.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Em desenvolvimento, libera o celular na rede local (ex.: http://192.168.15.9:3000).
  // Só o hostname conta, e cada "*" vale por um pedaço do endereço.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // O navegador chama /api/... no próprio endereço do app e o Next repassa para a API.
  // Assim o cookie de sessão fica no mesmo endereço do app, em qualquer aparelho.
  async rewrites() {
    return [{ source: "/api/:caminho*", destination: `${API_INTERNA}/:caminho*` }];
  },
  poweredByHeader: false,
  // Ninguém embute o app em outro site (clique enganado), nem adivinha o tipo dos arquivos.
  async headers() {
    return [
      {
        source: "/:caminho*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// O service worker (PWA) é gerado pela rota src/app/serwist/[path]/route.ts.
export default withSerwist(nextConfig);
