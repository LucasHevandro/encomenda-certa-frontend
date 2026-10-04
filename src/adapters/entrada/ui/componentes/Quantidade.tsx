"use client";

import { useState } from "react";
import { cx } from "./cx";
import { Icone } from "./Icone";

export interface QuantidadeProps {
  valor: number;
  aoMudar: (n: number) => void;
  /** Nome do produto, para leitores de tela. */
  rotulo?: string;
  min?: number;
  max?: number;
  /** Chamado ao tocar + no limite; a tela usa para abrir o aviso "Reservar N". */
  aoExceder?: (tentado: number) => void;
  className?: string;
}

const BOTAO =
  "grid size-12 cursor-pointer place-items-center rounded-sm border-[1.5px] border-line-strong bg-surface-raised text-ink disabled:cursor-not-allowed disabled:opacity-40";

/** Seletor − valor +. No limite, o + fica tracejado e explica o motivo em vez de somar. */
export function Quantidade({ valor, aoMudar, rotulo = "quantidade", min = 0, max, aoExceder, className }: QuantidadeProps) {
  const [excedeu, setExcedeu] = useState(false);
  const noLimite = max != null && valor >= max;

  function mais() {
    if (noLimite) {
      setExcedeu(true);
      aoExceder?.(valor + 1);
      return;
    }
    setExcedeu(false);
    aoMudar(valor + 1);
  }

  function menos() {
    if (valor <= min) return;
    setExcedeu(false);
    aoMudar(valor - 1);
  }

  return (
    <div className={cx("inline-flex flex-col gap-2", className)}>
      <div role="group" aria-label={rotulo} className="inline-flex items-center gap-1 self-start rounded-md bg-surface-sunken p-1">
        <button type="button" className={BOTAO} onClick={menos} disabled={valor <= min} aria-label={`Diminuir ${rotulo}`}>
          <Icone nome="menos" />
        </button>
        <output aria-live="polite" className="min-w-12 text-center font-display text-[26px] font-bold tabular-nums">
          {valor}
        </output>
        <button
          type="button"
          className={cx(BOTAO, noLimite && "border-dashed text-ink-muted")}
          onClick={mais}
          aria-label={`Aumentar ${rotulo}`}
        >
          <Icone nome="mais" />
        </button>
      </div>
      {excedeu && noLimite && (
        <p role="alert" className="m-0 flex items-center gap-1 text-rotulo text-critico">
          <Icone nome="alerta" tamanho={16} />
          Não há quantidade suficiente. Disponível: {max}.
        </p>
      )}
    </div>
  );
}
