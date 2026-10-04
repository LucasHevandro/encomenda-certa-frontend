import { TelaNovoPedido } from "@/adapters/entrada/ui/telas/novo-pedido/TelaNovoPedido";

export default async function Page({ params }: PageProps<"/dias/[diaId]/pedidos/novo">) {
  const { diaId } = await params;
  return <TelaNovoPedido diaId={diaId} />;
}
