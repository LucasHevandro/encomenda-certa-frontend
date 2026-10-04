import { TelaPedidos } from "@/adapters/entrada/ui/telas/pedidos/TelaPedidos";

export default async function Page({ params }: PageProps<"/dias/[diaId]/pedidos">) {
  const { diaId } = await params;
  return <TelaPedidos diaId={diaId} />;
}
