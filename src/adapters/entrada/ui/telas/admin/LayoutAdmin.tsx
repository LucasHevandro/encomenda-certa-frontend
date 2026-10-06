"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BotaoTema } from "../../componentes";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

/** Casca do painel do administrador do sistema: fora de qualquer empresa. */
export function LayoutAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { sessao } = useCasosDeUso();

  async function sair() {
    await sessao.sair();
    router.replace("/entrar");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <nav aria-label="Administração" className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 tablet:px-6">
          <span className="py-3 font-display text-titulo whitespace-nowrap">Painel de empresas</span>
          <BotaoTema compacto className="ml-auto" />
          <button type="button" onClick={sair} className="flex min-h-12 cursor-pointer items-center px-3 text-rotulo whitespace-nowrap text-ink-muted">
            Sair
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
