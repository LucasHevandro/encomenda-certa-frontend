import type { ReactNode } from "react";
import { LayoutAdmin } from "@/adapters/entrada/ui/telas/admin/LayoutAdmin";

export default function Layout({ children }: { children: ReactNode }) {
  return <LayoutAdmin>{children}</LayoutAdmin>;
}
