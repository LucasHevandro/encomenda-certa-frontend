"use client";

import { useState } from "react";
import type { DesempenhoDoProduto } from "@/core/domain/fechamento/Fechamento";
import { Cartao, Carregando, FalhaAoCarregar, Filtros, LinkBotao, Pagina, Resumo, Secao, Vazio } from "../../componentes";
import { cx } from "../../componentes/cx";
import { dataCurta, dinheiroCurto } from "../../formatos";
import { useRelatorio } from "../../hooks/consultas";

type Periodo = "4" | "8" | "12";

/** Como cada produto foi nos últimos dias fechados: apoio para decidir a produção. */
export function TelaRelatorio() {
  const [periodo, setPeriodo] = useState<Periodo>("8");
  const relatorio = useRelatorio(Number(periodo));

  return (
    <Pagina>
      <header className="flex flex-col gap-1 pt-6">
        <h1 className="m-0 font-display text-display">Relatório</h1>
        <p className="m-0 text-ink-muted">Médias dos dias já fechados. São apoio para decidir a produção, não regra.</p>
      </header>

      <Filtros<Periodo>
        rotulo="Período"
        ativo={periodo}
        aoMudar={setPeriodo}
        opcoes={[
          { id: "4", rotulo: "Últimos 4 dias" },
          { id: "8", rotulo: "8 dias" },
          { id: "12", rotulo: "12 dias" },
        ]}
      />

      {relatorio.isPending ? (
        <Carregando />
      ) : relatorio.isError ? (
        <FalhaAoCarregar erro={relatorio.error} aoTentarDeNovo={() => relatorio.refetch()} />
      ) : relatorio.data.dias === 0 ? (
        <Vazio>Nenhum dia fechado ainda. O relatório aparece depois do primeiro fechamento.</Vazio>
      ) : (
        <>
          <Resumo
            itens={[
              { valor: dinheiroCurto(relatorio.data.faturamento), rotulo: relatorio.data.dias === 1 ? "vendidos em 1 dia" : `vendidos em ${relatorio.data.dias} dias` },
              { valor: dinheiroCurto(relatorio.data.faturamentoMedio), rotulo: "por dia, em média" },
            ]}
          />
          <Secao titulo="Por produto">
            <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
              {relatorio.data.produtos.map((produto) => (
                <li key={produto.produtoId}>
                  <CartaoDesempenho produto={produto} />
                </li>
              ))}
            </ul>
          </Secao>
        </>
      )}

      <LinkBotao href="/dias" variante="fantasma" bloco>
        Voltar aos dias de venda
      </LinkBotao>
    </Pagina>
  );
}

function CartaoDesempenho({ produto }: { produto: DesempenhoDoProduto }) {
  const sobrou = produto.mediaSobras > 0;
  // Muita sobra pede produzir menos; tudo vendido pode pedir produzir mais.
  const dica =
    produto.aproveitamento >= 98 ? "Vendeu quase tudo: talvez dê para produzir mais." : produto.aproveitamento < 85 ? "Sobrou bastante: talvez dê para produzir menos." : null;
  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="m-0 font-display text-titulo">{produto.nome}</h3>
        <span className="text-rotulo text-ink-muted">{produto.dias === 1 ? "1 dia" : `${produto.dias} dias`}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-numero-lg tabular-nums">{produto.aproveitamento}%</span>
        <span className="text-ink-muted">da produção vendida</span>
      </div>
      <div role="img" aria-label={`${produto.aproveitamento}% da produção vendida`} className="h-2 overflow-hidden rounded-sm bg-surface-sunken">
        <span className={cx("block h-full rounded-[inherit]", produto.aproveitamento >= 85 ? "bg-ok" : "bg-alerta")} style={{ width: `${Math.min(100, produto.aproveitamento)}%` }} />
      </div>
      <dl className="m-0 grid grid-cols-3 gap-2">
        <Media rotulo="Produção" valor={produto.mediaProduzida} />
        <Media rotulo="Vendidos" valor={produto.mediaVendida} />
        <Media rotulo="Sobras" valor={produto.mediaSobras} destaque={sobrou} />
      </dl>
      {produto.mediaNaoRetirados > 0 && <p className="m-0 text-rotulo font-normal text-ink-muted">Em média {produto.mediaNaoRetirados} não retirados por dia.</p>}
      {dica && <p className="m-0 text-rotulo text-ink">{dica}</p>}
      <details className="border-t border-line pt-3">
        <summary className="cursor-pointer text-rotulo text-brasa">Dia a dia</summary>
        <table className="mt-2 w-full border-collapse text-left text-rotulo font-normal tabular-nums">
          <thead>
            <tr className="text-ink-muted">
              <th className="py-1 font-semibold">Dia</th>
              <th className="py-1 text-right font-semibold">Produção</th>
              <th className="py-1 text-right font-semibold">Vendidos</th>
              <th className="py-1 text-right font-semibold">Sobras</th>
            </tr>
          </thead>
          <tbody>
            {produto.porDia.map((dia) => (
              <tr key={dia.data} className="border-t border-line">
                <td className="py-1">{dataCurta(dia.data)}</td>
                <td className="py-1 text-right">{dia.produzidos}</td>
                <td className="py-1 text-right">{dia.vendidos}</td>
                <td className="py-1 text-right">{dia.sobras}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Cartao>
  );
}

function Media({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div>
      <dt className="text-rotulo text-ink-muted">{rotulo}</dt>
      <dd className={cx("m-0 text-[20px] leading-7 font-bold tabular-nums", destaque && "text-alerta")}>{valor.toLocaleString("pt-BR")}</dd>
    </div>
  );
}
