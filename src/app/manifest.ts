import type { MetadataRoute } from "next";

/** Instala na tela do celular e do tablet do balcão. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Encomenda Certa",
    short_name: "Encomenda Certa",
    description: "Encomendas e produção, num lugar só",
    lang: "pt-BR",
    start_url: "/dias",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f2eb",
    theme_color: "#b5441a",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
