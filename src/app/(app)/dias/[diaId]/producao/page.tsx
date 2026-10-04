import { TelaProducao } from "@/adapters/entrada/ui/telas/producao/TelaProducao";

export default async function Page({ params }: PageProps<"/dias/[diaId]/producao">) {
  const { diaId } = await params;
  return <TelaProducao diaId={diaId} />;
}
