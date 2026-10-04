"use client";

import { type ReactNode, useEffect } from "react";
import { Botao } from "./Botao";

export interface ConfirmacaoProps {
  titulo: string;
  confirmar?: string;
  cancelar?: string;
  perigo?: boolean;
  aberto: boolean;
  ocupado?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  children?: ReactNode;
}

/** Folha que sobe do rodapé para confirmar retirada, cancelamento e fechamento. */
export function Confirmacao({
  titulo,
  confirmar = "Confirmar",
  cancelar = "Voltar",
  perigo,
  aberto,
  ocupado,
  aoConfirmar,
  aoCancelar,
  children,
}: ConfirmacaoProps) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoCancelar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoCancelar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55" onClick={aoCancelar}>
      <div
        role="dialog"
        aria-modal
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="folha-subindo w-full max-w-coluna rounded-t-lg bg-surface-raised px-5 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] shadow-flutuante"
      >
        <h2 className="m-0 mb-2 font-display text-titulo">{titulo}</h2>
        {children && <div className="mb-5 text-ink-muted">{children}</div>}
        <div className="flex flex-col gap-2">
          <Botao variante={perigo ? "perigo" : "primario"} bloco onClick={aoConfirmar} disabled={ocupado}>
            {confirmar}
          </Botao>
          <Botao variante="fantasma" bloco onClick={aoCancelar}>
            {cancelar}
          </Botao>
        </div>
      </div>
    </div>
  );
}
