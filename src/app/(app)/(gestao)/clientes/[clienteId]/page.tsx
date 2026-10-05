import { TelaCliente } from "@/adapters/entrada/ui/telas/clientes/TelaCliente";

export default async function Page({ params }: PageProps<"/clientes/[clienteId]">) {
  const { clienteId } = await params;
  return <TelaCliente clienteId={clienteId} />;
}
