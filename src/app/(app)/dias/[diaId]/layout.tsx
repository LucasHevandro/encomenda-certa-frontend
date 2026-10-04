import { LayoutDoDia } from "@/adapters/entrada/ui/telas/dia/LayoutDoDia";

export default async function Layout({ children, params }: LayoutProps<"/dias/[diaId]">) {
  const { diaId } = await params;
  return <LayoutDoDia diaId={diaId}>{children}</LayoutDoDia>;
}
