"use client";

import { type FormEvent, useState } from "react";
import { disponiveis } from "@/core/domain/disponibilidade/Disponibilidade";
import { estaAberto } from "@/core/domain/dia-venda/DiaVenda";
import type { EntradaEspera } from "@/core/domain/lista-espera/EntradaEspera";
import {
  Aviso,
  Botao,
  CabecalhoDia,
  Campo,
  Cartao,
  Carregando,
  FalhaAoCarregar,
  Filtros,
  LinkBotao,
  Pagina,
  Quantidade,
  Secao,
  Status,
  Vazio,
} from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { dataLonga, quantidadeDe, telefone } from "../../formatos";
import { useAdicionarNaEspera, useMudarEspera } from "../../hooks/acoes";
import { useEspera, usePainel } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";

/** Lista de espera por produto, em ordem de chegada. Quando sobra unidade, dá para atender o primeiro da fila. */
export function TelaEspera({ diaId }: { diaId: string }) {
  const painel = usePainel(diaId);
  const espera = useEspera(diaId);
  const mudar = useMudarEspera(diaId);
  const online = useConexao();

  if (painel.isPending || espera.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (painel.isError || espera.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={painel.error ?? espera.error} aoTentarDeNovo={() => (painel.refetch(), espera.refetch())} />
      </Pagina>
    );
  }

  const { dia, estoques } = painel.data;
  const aberto = estaAberto(dia) && online;
  const aguardando = espera.data.filter((e) => e.status === "aguardando");
  const resolvidos = espera.data.filter((e) => e.status !== "aguardando");

  return (
    <Pagina>
      <CabecalhoDia sobretitulo="Lista de espera" data={dataLonga(dia.data)} />

      {estoques
        .filter((estoque) => aguardando.some((e) => e.produtoId === estoque.produtoId))
        .map((estoque) => {
          const fila = aguardando.filter((e) => e.produtoId === estoque.produtoId).sort((a, b) => a.posicao - b.posicao);
          const livres = disponiveis(estoque);
          return (
            <Secao
              key={estoque.produtoId}
              titulo={estoque.nome}
              acao={livres > 0 ? <Status estado="disponivel">{`${livres} ${livres === 1 ? "disponível" : "disponíveis"}`}</Status> : <Status estado="esgotado" />}
            >
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {fila.map((entrada, i) => (
                  <LinhaEspera
                    key={entrada.id}
                    ordem={i + 1}
                    entrada={entrada}
                    nomeProduto={estoque.nome}
                    podeAtender={aberto && livres >= entrada.quantidade}
                    ocupado={mudar.isPending || !aberto}
                    aoMudar={(status) => mudar.mutate({ entradaId: entrada.id, status })}
                    hrefPedido={`/dias/${diaId}/pedidos/novo?${new URLSearchParams({
                      nome: entrada.cliente.nome,
                      telefone: entrada.cliente.telefone ?? "",
                      produto: entrada.produtoId,
                      quantidade: String(Math.min(entrada.quantidade, livres)),
                      espera: entrada.id,
                    })}`}
                  />
                ))}
              </ol>
            </Secao>
          );
        })}

      {aguardando.length === 0 && <Vazio>Ninguém aguardando neste dia.</Vazio>}
      {mudar.isError && <Aviso tom="critico">{mensagemDeErro(mudar.error)}</Aviso>}

      {estaAberto(dia) && <AdicionarNaEspera diaId={diaId} produtos={estoques.map((e) => ({ id: e.produtoId, nome: e.nome }))} />}

      {resolvidos.length > 0 && (
        <Secao titulo="Já resolvidos">
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-ink-muted">
            {resolvidos.map((e) => (
              <li key={e.id}>
                {e.cliente.nome} · {quantidadeDe(e.quantidade, (estoques.find((s) => s.produtoId === e.produtoId)?.nome ?? "").toLowerCase())} ·{" "}
                {e.status === "atendido" ? "atendido" : "desistiu"}
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </Pagina>
  );
}

function LinhaEspera({
  ordem,
  entrada,
  nomeProduto,
  podeAtender,
  ocupado,
  aoMudar,
  hrefPedido,
}: {
  ordem: number;
  entrada: EntradaEspera;
  nomeProduto: string;
  podeAtender: boolean;
  ocupado: boolean;
  aoMudar: (status: "atendido" | "desistiu") => void;
  hrefPedido: string;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line bg-surface-raised p-4 shadow-cartao">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[17px] font-semibold">
          {ordem}. {entrada.cliente.nome} — {quantidadeDe(entrada.quantidade, nomeProduto.toLowerCase())}
        </span>
        {entrada.cliente.telefone && <span className="text-rotulo font-normal text-ink-muted">{telefone(entrada.cliente.telefone)}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {podeAtender && (
          <LinkBotao href={hrefPedido} tamanho="md" icone="mais">
            Fazer pedido
          </LinkBotao>
        )}
        <Botao variante="fantasma" tamanho="md" disabled={ocupado} onClick={() => aoMudar("atendido")}>
          Atendido
        </Botao>
        <Botao variante="fantasma" tamanho="md" disabled={ocupado} onClick={() => aoMudar("desistiu")}>
          Desistiu
        </Botao>
      </div>
    </li>
  );
}

function AdicionarNaEspera({ diaId, produtos }: { diaId: string; produtos: { id: string; nome: string }[] }) {
  const adicionar = useAdicionarNaEspera();
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  function enviar(e: FormEvent) {
    e.preventDefault();
    adicionar.mutate(
      { diaId, produtoId, cliente: { nome, telefone: tel }, quantidade },
      {
        onSuccess: () => {
          setNome("");
          setTel("");
          setQuantidade(1);
        },
      },
    );
  }

  if (produtos.length === 0) return null;
  return (
    <Secao titulo="Adicionar na espera">
      <Cartao>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <Filtros rotulo="Produto" opcoes={produtos.map((p) => ({ id: p.id, rotulo: p.nome }))} ativo={produtoId} aoMudar={setProdutoId} />
          <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
          <Campo rotulo="Telefone" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} dica="Opcional." autoComplete="off" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-rotulo">Quantidade</span>
            <Quantidade rotulo="Quantidade na espera" valor={quantidade} min={1} aoMudar={setQuantidade} />
          </div>
          {adicionar.isError && <Aviso tom="critico">{mensagemDeErro(adicionar.error)}</Aviso>}
          <Botao type="submit" variante="secundario" bloco icone="espera" disabled={adicionar.isPending}>
            Adicionar na lista de espera
          </Botao>
        </form>
      </Cartao>
    </Secao>
  );
}
