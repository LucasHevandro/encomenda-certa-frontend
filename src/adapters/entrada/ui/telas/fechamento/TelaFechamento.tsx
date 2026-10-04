"use client";

import { useState } from "react";
import { estaAberto } from "@/core/domain/dia-venda/DiaVenda";
import type { FechamentoDoProduto } from "@/core/domain/fechamento/Fechamento";
import {
  Aviso,
  Botao,
  CabecalhoDia,
  Cartao,
  Carregando,
  Confirmacao,
  FalhaAoCarregar,
  LinkBotao,
  Pagina,
  Resumo,
  Secao,
  Status,
} from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { dataCurta, dataLonga, diaDaSemana, dinheiro, dinheiroCurto } from "../../formatos";
import { useFecharDia } from "../../hooks/acoes";
import { useFechamento } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";

const COLUNAS: { chave: keyof FechamentoDoProduto; rotulo: string }[] = [
  { chave: "produzidos", rotulo: "Produzidos" },
  { chave: "reservados", rotulo: "Reservados" },
  { chave: "retirados", rotulo: "Retirados" },
  { chave: "naoRetirados", rotulo: "Não retirados" },
  { chave: "sobras", rotulo: "Sobras" },
];

/** Fechamento: o que aconteceu com cada produto e o financeiro. Fechar deixa o dia só para leitura. */
export function TelaFechamento({ diaId }: { diaId: string }) {
  const consulta = useFechamento(diaId);
  const fechar = useFecharDia(diaId);
  const online = useConexao();
  const [confirmando, setConfirmando] = useState(false);

  if (consulta.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (consulta.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />
      </Pagina>
    );
  }

  const { dia, fechamento } = consulta.data;
  const aberto = estaAberto(dia);
  const semana = diaDaSemana(dia.data).toLowerCase();

  return (
    <Pagina larga>
      <CabecalhoDia sobretitulo="Fechamento" data={dataLonga(dia.data)} acao={!aberto && <Status estado="retirado">Dia fechado</Status>} />

      <Resumo
        itens={[
          { valor: dinheiroCurto(fechamento.totalVendido), rotulo: "total vendido" },
          { valor: fechamento.pedidos, rotulo: fechamento.pedidos === 1 ? "pedido" : "pedidos" },
          { valor: fechamento.itensVendidos, rotulo: fechamento.itensVendidos === 1 ? "item vendido" : "itens vendidos" },
          { valor: fechamento.sobras, rotulo: fechamento.sobras === 1 ? "sobra" : "sobras" },
        ]}
      />
      {fechamento.pedidosNaoRetirados > 0 && (
        <p className="m-0 -mt-3 text-ink-muted">
          O total inclui {dinheiro(fechamento.valorNaoRetirado)} de{" "}
          {fechamento.pedidosNaoRetirados === 1 ? "1 pedido não retirado" : `${fechamento.pedidosNaoRetirados} pedidos não retirados`}.
        </p>
      )}

      <Secao titulo="Por produto">
        {/* Celular e tablet: um cartão por produto. Desktop: tabela simples. */}
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2 desktop:hidden">
          {fechamento.produtos.map((produto) => (
            <li key={produto.produtoId}>
              <Cartao className="flex flex-col gap-3">
                <h3 className="m-0 font-display text-titulo">{produto.nome}</h3>
                <dl className="m-0 grid grid-cols-3 gap-2">
                  {COLUNAS.map((c) => (
                    <div key={c.chave}>
                      <dt className="text-rotulo text-ink-muted">{c.rotulo}</dt>
                      <dd className="m-0 text-[20px] leading-7 font-bold tabular-nums">{produto[c.chave]}</dd>
                    </div>
                  ))}
                </dl>
              </Cartao>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-hidden rounded-lg border border-line bg-surface-raised desktop:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-rotulo text-ink-muted">
                <th className="px-4 py-3 font-semibold">Produto</th>
                {COLUNAS.map((c) => (
                  <th key={c.chave} className="px-4 py-3 text-right font-semibold">
                    {c.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fechamento.produtos.map((produto) => (
                <tr key={produto.produtoId} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{produto.nome}</td>
                  {COLUNAS.map((c) => (
                    <td key={c.chave} className="px-4 py-3 text-right font-bold tabular-nums">
                      {produto[c.chave]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      {aberto && (
        <div className="flex flex-col gap-3">
          {fechamento.pedidosNaoRetirados > 0 && (
            <Aviso
              tom="alerta"
              titulo="Ainda há pedidos para retirar"
              acoes={
                <LinkBotao href={`/dias/${diaId}/pedidos`} tamanho="md">
                  Ver pedidos
                </LinkBotao>
              }
            >
              Existem {fechamento.pedidosNaoRetirados === 1 ? "1 pedido ainda marcado" : `${fechamento.pedidosNaoRetirados} pedidos ainda marcados`} como
              Reservado. Eles entram no total vendido, mas não como sobra.
            </Aviso>
          )}
          {fechar.isError && <Aviso tom="critico">{mensagemDeErro(fechar.error)}</Aviso>}
          <Botao bloco icone="check" disabled={!online} onClick={() => setConfirmando(true)}>
            Fechar o {semana}
          </Botao>
        </div>
      )}

      <Confirmacao
        aberto={confirmando}
        titulo={`Fechar o ${semana} ${dataCurta(dia.data).split(", ")[1]}?`}
        confirmar={`Fechar o ${semana}`}
        ocupado={fechar.isPending}
        aoCancelar={() => setConfirmando(false)}
        aoConfirmar={() => fechar.mutate(undefined, { onSettled: () => setConfirmando(false) })}
      >
        Depois de fechar, o dia não aceita mais pedidos, retiradas nem mudanças de produção.
      </Confirmacao>
    </Pagina>
  );
}
