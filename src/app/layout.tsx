import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { SCRIPT_DO_TEMA } from "@/adapters/entrada/ui/tema";
import { AplicarMarca } from "@/adapters/entrada/ui/telas/geral/Marca";
import { ProvedorDependencias } from "@/config/ProvedorDependencias";
import "../styles/tokens.css";
import "../styles/globals.css";

const display = Bricolage_Grotesque({ variable: "--fonte-display", subsets: ["latin", "latin-ext"] });
const sans = Figtree({ variable: "--fonte-sans", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  applicationName: "Encomenda Certa",
  title: "Encomenda Certa",
  description: "Encomendas e produção, num lugar só",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Encomenda Certa" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2eb" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script abaixo pode pôr data-theme no <html> antes de o React assumir.
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Tema escolhido neste aparelho, aplicado antes da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"} reloadOnOnline={false}>
          <ProvedorDependencias>
            <AplicarMarca />
            {children}
          </ProvedorDependencias>
        </SerwistProvider>
      </body>
    </html>
  );
}
