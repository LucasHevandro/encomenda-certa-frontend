import { TelaDetalhePedido } from "@/adapters/entrada/ui/telas/detalhe-pedido/TelaDetalhePedido";

export default async function Page({ params }: PageProps<"/dias/[diaId]/pedidos/[pedidoId]">) {
  const { diaId, pedidoId } = await params;
  return <TelaDetalhePedido diaId={diaId} pedidoId={pedidoId} />;
}
