import { TelaInicio } from "@/adapters/entrada/ui/telas/inicio/TelaInicio";

export default async function Page({ params }: PageProps<"/dias/[diaId]">) {
  const { diaId } = await params;
  return <TelaInicio diaId={diaId} />;
}
