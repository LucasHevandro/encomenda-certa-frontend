"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SugestaoProducao } from "@/core/application/portas/DiasGateway";
import {
  Aviso,
  Botao,
  Campo,
  Carregando,
  FalhaAoCarregar,
  Filtros,
  LinkBotao,
  Pagina,
  Quantidade,
  Secao,
  Vazio,
} from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { dataCurta, dataIso, diaDaSemana } from "../../formatos";
import { useAbrirDia } from "../../hooks/acoes";
import { chaves } from "../../hooks/chaves";
import { useConfiguracao, useProdutos } from "../../hooks/consultas";
import { descreverDias } from "@/core/domain/configuracao/Configuracao";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { useConexao } from "../../hooks/useConexao";

type Base = "ultimo" | "media" | "zero";

function valorBase(base: Base, sugestao: SugestaoProducao | undefined): number {
  if (!sugestao || base === "zero") return 0;
  return base === "ultimo" ? sugestao.ultimo : sugestao.media;
}

/** Novo dia de venda: sugere o próximo domingo livre e a produção do último dia. */
export function TelaNovoDia() {
  const router = useRouter();
  const online = useConexao();
  const { abrirDia } = useCasosDeUso();
  const produtos = useProdutos();
  const { diasDeVenda } = useConfiguracao();
  const pronto = useQuery({
    queryKey: [...chaves.prontoParaAbrir(), diasDeVenda.join(",")],
    queryFn: () => abrirDia.preparar(dataIso(new Date()), diasDeVenda),
  });
  const abrir = useAbrirDia(pronto.data?.existentes ?? [], diasDeVenda);

  const [data, setData] = useState<string | null>(null);
  const [base, setBase] = useState<Base>("ultimo");
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  if (pronto.isPending || produtos.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (pronto.isError || produtos.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={pronto.error ?? produtos.error} aoTentarDeNovo={() => (pronto.refetch(), produtos.refetch())} />
      </Pagina>
    );
  }

  const ativos = produtos.data.filter((p) => p.ativo);
  const sugestaoDe = (produtoId: string) => pronto.data.sugestoes.find((s) => s.produtoId === produtoId);
  const quantidade = (produtoId: string) => quantidades[produtoId] ?? valorBase(base, sugestaoDe(produtoId));
  const dataEscolhida = data ?? pronto.data.data;

  function confirmar() {
    abrir.mutate(
      { data: dataEscolhida, producao: ativos.map((p) => ({ produtoId: p.id, quantidade: quantidade(p.id) })) },
      { onSuccess: (dia) => router.push(`/dias/${dia.id}`) },
    );
  }

  return (
    <Pagina>
      <header className="pt-6">
        <p className="m-0 mb-0.5 text-rotulo tracking-[.06em] text-brasa uppercase">Novo dia de venda</p>
        <h1 className="m-0 font-display text-display">{dataEscolhida ? dataCurta(dataEscolhida) : "Escolha a data"}</h1>
      </header>

      <Campo
        rotulo="Data"
        type="date"
        value={dataEscolhida}
        onChange={(e) => {
          setData(e.target.value);
          abrir.reset();
        }}
        dica={dataEscolhida ? `${diaDaSemana(dataEscolhida)}. Dias de venda: ${descreverDias(diasDeVenda)}.` : undefined}
      />

      <Secao titulo="Produção">
        <Filtros<Base>
          rotulo="Começar a produção por"
          ativo={base}
          aoMudar={(nova) => {
            setBase(nova);
            setQuantidades({});
          }}
          opcoes={[
            { id: "ultimo", rotulo: "Último dia" },
            { id: "media", rotulo: "Média de 4" },
            { id: "zero", rotulo: "Zero" },
          ]}
        />
        {ativos.length === 0 ? (
          <Vazio
            acao={
              <LinkBotao href="/produtos" tamanho="md">
                Cadastrar produtos
              </LinkBotao>
            }
          >
            Nenhum produto ativo.
          </Vazio>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {ativos.map((produto) => {
              const sugestao = sugestaoDe(produto.id);
              return (
                <li key={produto.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised p-4 shadow-cartao">
                  <div className="flex flex-col">
                    <span className="text-[17px] font-semibold">{produto.nome}</span>
                    <span className="text-rotulo font-normal text-ink-muted">
                      {sugestao
                        ? `Último: ${sugestao.ultimo} · Média: ${sugestao.media} · Sobra média: ${sugestao.sobraMedia}`
                        : "Sem histórico ainda"}
                    </span>
                  </div>
                  <Quantidade
                    rotulo={`Produção de ${produto.nome}`}
                    valor={quantidade(produto.id)}
                    aoMudar={(n) => setQuantidades((atual) => ({ ...atual, [produto.id]: n }))}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Secao>

      {abrir.isError && <Aviso tom="critico">{mensagemDeErro(abrir.error)}</Aviso>}

      <Botao bloco icone="check" disabled={!online || abrir.isPending || !dataEscolhida} onClick={confirmar}>
        {abrir.isPending ? "Abrindo…" : "Abrir dia de venda"}
      </Botao>
      <LinkBotao href="/dias" variante="fantasma" bloco>
        Voltar
      </LinkBotao>
    </Pagina>
  );
}
