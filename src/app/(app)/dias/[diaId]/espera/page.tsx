import { TelaEspera } from "@/adapters/entrada/ui/telas/espera/TelaEspera";

export default async function Page({ params }: PageProps<"/dias/[diaId]/espera">) {
  const { diaId } = await params;
  return <TelaEspera diaId={diaId} />;
}
