"use client";

import type { ReactNode } from "react";
import { Botao } from "./Botao";
import { Folha } from "./Folha";

export interface ConfirmacaoProps {
  /** A pergunta, com o número do pedido. */
  titulo: string;
  /** Repete o verbo da pergunta: "Confirmar retirada". */
  confirmar?: string;
  /** "Voltar" quando o confirmar já é "Cancelar …", para não haver dois "Cancelar". */
  cancelar?: string;
  perigo?: boolean;
  aberto: boolean;
  ocupado?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  children?: ReactNode;
}

/** Folha para confirmar retirada, cancelamento e fechamento. Não use em ações simples. */
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
  return (
    <Folha titulo={titulo} aberta={aberto} aoFechar={aoCancelar}>
      {children && <div className="mb-5 text-ink-muted">{children}</div>}
      <div className="flex flex-col gap-2">
        <Botao variante={perigo ? "perigo" : "primario"} bloco onClick={aoConfirmar} disabled={ocupado}>
          {confirmar}
        </Botao>
        <Botao variante="fantasma" bloco onClick={aoCancelar}>
          {cancelar}
        </Botao>
      </div>
    </Folha>
  );
}
