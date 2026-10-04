import { TelaFechamento } from "@/adapters/entrada/ui/telas/fechamento/TelaFechamento";

export default async function Page({ params }: PageProps<"/dias/[diaId]/fechamento">) {
  const { diaId } = await params;
  return <TelaFechamento diaId={diaId} />;
}
