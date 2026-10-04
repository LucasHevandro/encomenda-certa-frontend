"use client";

import { useMemo, useState } from "react";
import { disponiveis, type EstoqueDoProduto } from "@/core/domain/disponibilidade/Disponibilidade";
import { estaAberto } from "@/core/domain/dia-venda/DiaVenda";
import { minimoPermitido } from "@/core/domain/producao/Producao";
import {
  Aviso,
  Botao,
  CabecalhoDia,
  Cartao,
  Carregando,
  FalhaAoCarregar,
  GrupoLista,
  ItemLista,
  Pagina,
  Quantidade,
  Secao,
  Vazio,
} from "../../componentes";
import { cx } from "../../componentes/cx";
import { mensagemDeErro } from "../../erros";
import { dataLonga, hora } from "../../formatos";
import { useSalvarProducao } from "../../hooks/acoes";
import { useHistoricoProducao, usePainel, useProdutos } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";

/** Produção planejada por produto. Nunca abaixo de reservados + vendidos; toda alteração fica registrada. */
export function TelaProducao({ diaId }: { diaId: string }) {
  const painel = usePainel(diaId);
  const produtos = useProdutos();
  const historico = useHistoricoProducao(diaId);
  const salvar = useSalvarProducao(diaId);
  const online = useConexao();
  const [novas, setNovas] = useState<Record<string, number>>({});
  const [salvo, setSalvo] = useState(false);

  /** Os produtos do dia e, no fim, os ativos que ainda não entraram nele (com produção zero). */
  const linhas = useMemo<EstoqueDoProduto[]>(() => {
    const doDia = painel.data?.estoques ?? [];
    const presentes = new Set(doDia.map((e) => e.produtoId));
    const faltando = (produtos.data ?? [])
      .filter((p) => p.ativo && !presentes.has(p.id))
      .map((p) => ({ produtoId: p.id, nome: p.nome, producao: 0, reservados: 0, vendidos: 0 }));
    return [...doDia, ...faltando];
  }, [painel.data, produtos.data]);

  if (painel.isPending || produtos.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (painel.isError || produtos.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={painel.error ?? produtos.error} aoTentarDeNovo={() => (painel.refetch(), produtos.refetch())} />
      </Pagina>
    );
  }

  const { dia } = painel.data;
  const aberto = estaAberto(dia);
  const valor = (e: EstoqueDoProduto) => novas[e.produtoId] ?? e.producao;
  const abaixo = linhas.filter((e) => valor(e) < minimoPermitido(e));
  const mudou = linhas.some((e) => valor(e) !== e.producao);
  const nomes = new Map(linhas.map((e) => [e.produtoId, e.nome]));

  function confirmar() {
    salvar.mutate(
      { novas: linhas.map((e) => ({ produtoId: e.produtoId, quantidade: valor(e) })), estoques: linhas },
      {
        onSuccess: () => {
          setNovas({});
          setSalvo(true);
        },
      },
    );
  }

  return (
    <Pagina>
      <CabecalhoDia sobretitulo="Produção" data={dataLonga(dia.data)} />

      {!aberto && (
        <Aviso tom="info" titulo="Este dia já foi fechado">
          A produção fica só para consulta.
        </Aviso>
      )}

      {linhas.length === 0 ? (
        <Vazio>Cadastre produtos para definir a produção.</Vazio>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {linhas.map((estoque) => {
            const nova = valor(estoque);
            const minimo = minimoPermitido(estoque);
            const disponiveisNovos = disponiveis({ ...estoque, producao: nova });
            const invalido = nova < minimo;
            return (
              <li
                key={estoque.produtoId}
                className={cx(
                  "flex flex-col gap-3 rounded-lg border bg-surface-raised p-4 shadow-cartao",
                  invalido ? "border-[1.5px] border-alerta" : "border-line",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <h3 className="m-0 font-display text-titulo">{estoque.nome}</h3>
                    {nova !== estoque.producao && (
                      <span className="text-rotulo font-normal text-ink-muted">
                        Era {estoque.producao}, vai para {nova}
                      </span>
                    )}
                  </div>
                  <Quantidade
                    rotulo={`Produção de ${estoque.nome}`}
                    valor={nova}
                    aoMudar={(n) => {
                      setNovas((atual) => ({ ...atual, [estoque.produtoId]: n }));
                      setSalvo(false);
                      salvar.reset();
                    }}
                  />
                </div>
                <dl className="m-0 grid grid-cols-3 gap-2">
                  <div>
                    <dt className="text-rotulo text-ink-muted">Reservados</dt>
                    <dd className="m-0 text-[20px] leading-7 font-bold tabular-nums">{estoque.reservados}</dd>
                  </div>
                  <div>
                    <dt className="text-rotulo text-ink-muted">Vendidos</dt>
                    <dd className="m-0 text-[20px] leading-7 font-bold tabular-nums">{estoque.vendidos}</dd>
                  </div>
                  <div>
                    <dt className="text-rotulo text-ink-muted">Disponíveis</dt>
                    <dd className={cx("m-0 text-[20px] leading-7 font-bold tabular-nums", disponiveisNovos === 0 ? "text-critico" : "text-ok")}>
                      {disponiveisNovos}
                    </dd>
                  </div>
                </dl>
                {invalido && (
                  <Aviso
                    tom="alerta"
                    titulo="Produção menor que as reservas"
                    acoes={
                      <Botao variante="secundario" tamanho="md" onClick={() => setNovas((atual) => ({ ...atual, [estoque.produtoId]: minimo }))}>
                        Ajustar para {minimo}
                      </Botao>
                    }
                  >
                    Existem {minimo} unidades reservadas ou vendidas, mas a nova produção seria de apenas {nova}.
                  </Aviso>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {salvar.isError && <Aviso tom="critico">{mensagemDeErro(salvar.error)}</Aviso>}
      {salvo && !mudou && (
        <Aviso tom="ok" titulo="Produção salva">
          Os novos números já valem para todos os aparelhos.
        </Aviso>
      )}

      {aberto && (
        <div className="sticky bottom-24 z-10 desktop:bottom-4">
          <Botao bloco icone="check" disabled={!online || !mudou || abaixo.length > 0 || salvar.isPending} onClick={confirmar} className="shadow-flutuante">
            {salvar.isPending ? "Salvando…" : "Salvar produção"}
          </Botao>
        </div>
      )}

      <Secao titulo="Alterações">
        {historico.data && historico.data.length > 0 ? (
          <GrupoLista>
            {[...historico.data].reverse().map((alteracao) => (
              <ItemLista
                key={`${alteracao.produtoId}-${alteracao.em}`}
                icone="producao"
                titulo={`${nomes.get(alteracao.produtoId) ?? alteracao.produtoId}: de ${alteracao.de} para ${alteracao.para}`}
                subtitulo={`${hora(alteracao.em)} · ${alteracao.usuario}`}
              />
            ))}
          </GrupoLista>
        ) : (
          <Cartao className="text-ink-muted">Nenhuma alteração neste dia ainda.</Cartao>
        )}
      </Secao>
    </Pagina>
  );
}
