"use client";

import { type ReactNode, useEffect } from "react";

/** Painel que sobe do rodapé sobre um fundo escuro. Fecha com Esc ou tocando fora. */
export function Folha({
  titulo,
  aberta,
  aoFechar,
  children,
}: {
  titulo: string;
  aberta: boolean;
  aoFechar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta, aoFechar]);

  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="folha-subindo max-h-[90dvh] w-full max-w-coluna overflow-y-auto rounded-t-lg bg-surface-raised px-5 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] shadow-flutuante"
      >
        <h2 className="m-0 mb-2 font-display text-titulo">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
