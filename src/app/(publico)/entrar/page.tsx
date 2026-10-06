import type { Metadata } from "next";
import { TelaEntrar } from "@/adapters/entrada/ui/telas/entrar/TelaEntrar";

export const metadata: Metadata = { title: "Entrar · Encomenda Certa" };

export default async function Page({ searchParams }: PageProps<"/entrar">) {
  const { proximo, aviso } = await searchParams;
  return <TelaEntrar proximo={typeof proximo === "string" ? proximo : undefined} aviso={typeof aviso === "string" ? aviso : undefined} />;
}
