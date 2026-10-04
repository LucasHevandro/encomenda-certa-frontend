"use client";

import { cx } from "./cx";
import { Icone } from "./Icone";

export interface OpcaoFiltro<T extends string> {
  id: T;
  rotulo: string;
  contagem?: number;
}

/** Chips de seleção única, roláveis na horizontal. O ativo é ink cheio com ✓. */
export function Filtros<T extends string>({
  opcoes,
  ativo,
  aoMudar,
  rotulo = "Filtro",
}: {
  opcoes: readonly OpcaoFiltro<T>[];
  ativo: T;
  aoMudar: (id: T) => void;
  rotulo?: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex gap-2 overflow-x-auto p-0.5 [scrollbar-width:none]">
      {opcoes.map((opcao) => {
        const marcado = opcao.id === ativo;
        return (
          <button
            key={opcao.id}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => aoMudar(opcao.id)}
            className={cx(
              "inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[15px] font-semibold whitespace-nowrap",
              marcado ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface-raised text-ink",
            )}
          >
            {marcado && <Icone nome="check" tamanho={16} />}
            {opcao.rotulo}
            {opcao.contagem != null && <span className="tabular-nums opacity-80">{opcao.contagem}</span>}
          </button>
        );
      })}
    </div>
  );
}
