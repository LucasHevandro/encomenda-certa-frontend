"use client";

import type { Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import { disponiveis, type EstoqueDoProduto, situacao } from "@/core/domain/disponibilidade/Disponibilidade";
import { cx } from "../../componentes/cx";
import { Quantidade, Status } from "../../componentes";
import { dinheiro } from "../../formatos";

export interface ExcessoPedido {
  readonly produtoId: string;
  readonly nome: string;
  readonly solicitado: number;
  readonly maximo: number;
}

/** Lista de produtos do dia com o disponível ao lado e o seletor limitado a ele. */
export function SeletorItens({
  estoques,
  precos,
  quantidades,
  aoMudar,
  aoExceder,
}: {
  estoques: readonly EstoqueDoProduto[];
  precos: ReadonlyMap<string, Dinheiro>;
  quantidades: Readonly<Record<string, number>>;
  aoMudar: (produtoId: string, quantidade: number) => void;
  aoExceder: (excesso: ExcessoPedido) => void;
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {estoques.map((estoque) => {
        const maximo = disponiveis(estoque);
        const valor = quantidades[estoque.produtoId] ?? 0;
        const preco = precos.get(estoque.produtoId);
        const estado = situacao(estoque);
        return (
          <li
            key={estoque.produtoId}
            className={cx(
              "flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface-raised p-4 shadow-cartao",
              valor > 0 ? "border-[1.5px] border-brasa" : "border-line",
            )}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[17px] font-semibold">{estoque.nome}</span>
              <span className="flex flex-wrap items-center gap-2 text-rotulo font-normal text-ink-muted">
                {preco != null && <span>{dinheiro(preco)}</span>}
                <Status estado={estado}>
                  {estado === "esgotado" ? "Esgotado" : `${maximo} ${maximo === 1 ? "disponível" : "disponíveis"}`}
                </Status>
              </span>
            </div>
            <Quantidade
              rotulo={estoque.nome}
              valor={valor}
              max={maximo}
              aoMudar={(n) => aoMudar(estoque.produtoId, n)}
              aoExceder={(tentado) => aoExceder({ produtoId: estoque.produtoId, nome: estoque.nome, solicitado: tentado, maximo })}
            />
          </li>
        );
      })}
    </ul>
  );
}
