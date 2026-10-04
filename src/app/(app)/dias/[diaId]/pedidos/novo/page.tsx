import { TelaNovoPedido } from "@/adapters/entrada/ui/telas/novo-pedido/TelaNovoPedido";

/** Aceita ?nome=&telefone=&produto=&quantidade=&espera= para atender alguém da lista de espera. */
export default async function Page({ params, searchParams }: PageProps<"/dias/[diaId]/pedidos/novo">) {
  const { diaId } = await params;
  const busca = await searchParams;
  const texto = (chave: string) => (typeof busca[chave] === "string" ? (busca[chave] as string) : undefined);
  const produto = texto("produto");
  const quantidade = Number(texto("quantidade") ?? 0);
  return (
    <TelaNovoPedido
      key={texto("espera") ?? "novo"}
      diaId={diaId}
      inicial={{
        nome: texto("nome") ?? "",
        telefone: texto("telefone") ?? "",
        quantidades: produto && quantidade > 0 ? { [produto]: quantidade } : {},
        esperaId: texto("espera"),
      }}
    />
  );
}
