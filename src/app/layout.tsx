import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { ProvedorDependencias } from "@/config/ProvedorDependencias";
import "../styles/tokens.css";
import "../styles/globals.css";

const display = Bricolage_Grotesque({ variable: "--fonte-display", subsets: ["latin", "latin-ext"] });
const sans = Figtree({ variable: "--fonte-sans", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Expresso Café",
  description: "Pedidos e produção dos assados, num lugar só",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <ProvedorDependencias>{children}</ProvedorDependencias>
      </body>
    </html>
  );
}
