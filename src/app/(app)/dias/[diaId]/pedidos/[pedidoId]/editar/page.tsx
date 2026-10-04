import { TelaEditarPedido } from "@/adapters/entrada/ui/telas/detalhe-pedido/TelaEditarPedido";

export default async function Page({ params }: PageProps<"/dias/[diaId]/pedidos/[pedidoId]/editar">) {
  const { diaId, pedidoId } = await params;
  return <TelaEditarPedido diaId={diaId} pedidoId={pedidoId} />;
}
