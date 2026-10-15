import type { Metadata } from "next";
import { TelaLoja } from "@/adapters/entrada/ui/telas/loja/TelaLoja";

export const metadata: Metadata = { title: "Encomendas" };

export default async function Page({ params }: PageProps<"/loja/[endereco]">) {
  const { endereco } = await params;
  return <TelaLoja endereco={endereco} />;
}
