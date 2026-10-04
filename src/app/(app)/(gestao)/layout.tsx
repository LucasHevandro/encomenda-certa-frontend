import type { ReactNode } from "react";
import { LayoutGeral } from "@/adapters/entrada/ui/telas/geral/LayoutGeral";

export default function Layout({ children }: { children: ReactNode }) {
  return <LayoutGeral>{children}</LayoutGeral>;
}
