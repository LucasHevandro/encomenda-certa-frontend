import type { Metadata } from "next";
import { TelaAcompanhamento } from "@/adapters/entrada/ui/telas/loja/TelaAcompanhamento";

// O link do pedido é secreto: não entra em buscadores nem vaza como referência.
export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params, searchParams }: PageProps<"/pedido/[codigo]">) {
  const { codigo } = await params;
  const { novo } = await searchParams;
  return <TelaAcompanhamento codigo={codigo} novo={novo === "1"} />;
}
