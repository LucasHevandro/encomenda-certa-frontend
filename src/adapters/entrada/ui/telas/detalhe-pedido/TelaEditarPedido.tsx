"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { devolverUnidades } from "@/core/application/casos-de-uso/pedidos/EditarPedido";
import { type Dinheiro, multiplicar, somar } from "@/core/domain/compartilhado/Dinheiro";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { estaAberto } from "@/core/domain/pedido/Pedido";
import { Aviso, Botao, CabecalhoDia, Cartao, Carregando, FalhaAoCarregar, LinkBotao, Pagina } from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { dinheiro, numeroPedido } from "../../formatos";
import { useEditarPedido } from "../../hooks/acoes";
import { usePainel, usePedido, useProdutos } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";
import { AvisoIndisponivel } from "../novo-pedido/AvisoIndisponivel";
import { type ExcessoPedido, SeletorItens } from "../novo-pedido/SeletorItens";

/** Mesma checagem do novo pedido, mas só o que aumentou precisa caber no disponível. */
export function TelaEditarPedido({ diaId, pedidoId }: { diaId: string; pedidoId: string }) {
  const router = useRouter();
  const online = useConexao();
  const consulta = usePedido(diaId, pedidoId);
  const painel = usePainel(diaId);
  const produtos = useProdutos();
  const [quantidades, setQuantidades] = useState<Record<string, number> | null>(null);
  const [excesso, setExcesso] = useState<ExcessoPedido | null>(null);

  const pedido = consulta.data;
  const estoques = useMemo(() => {
    if (!pedido || !painel.data || !produtos.data) return [];
    const doPedido = new Set(pedido.itens.map((i) => i.produtoId));
    const ativos = new Set(produtos.data.filter((p) => p.ativo).map((p) => p.id));
    return devolverUnidades(painel.data.estoques, pedido).filter((e) => ativos.has(e.produtoId) || doPedido.has(e.produtoId));
  }, [pedido, painel.data, produtos.data]);
  const editar = useEditarPedido(pedido, painel.data?.estoques);

  if (consulta.isPending || painel.isPending || produtos.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (consulta.isError || painel.isError || produtos.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={consulta.error ?? painel.error ?? produtos.error} />
      </Pagina>
    );
  }
  if (!pedido) return null;

  const voltar = `/dias/${diaId}/pedidos/${pedidoId}`;
  if (!estaAberto(pedido)) {
    return (
      <Pagina>
        <CabecalhoDia sobretitulo={`Editar ${numeroPedido(pedido.numero)}`} data={pedido.cliente.nome} />
        <Aviso tom="alerta" titulo="Este pedido não pode mais ser editado" acoes={<LinkBotao href={voltar} tamanho="md">Voltar ao pedido</LinkBotao>}>
          Só pedidos reservados podem ser editados.
        </Aviso>
      </Pagina>
    );
  }

  // O preço de quem já está no pedido é o da época; produtos novos entram com o preço atual.
  const precos = new Map<string, Dinheiro>((produtos.data ?? []).map((p) => [p.id, p.preco]));
  for (const item of pedido.itens) precos.set(item.produtoId, item.precoUnitario);
  const atuais = quantidades ?? Object.fromEntries(pedido.itens.map((i) => [i.produtoId, i.quantidade]));
  const total = somar(...estoques.map((e) => multiplicar(precos.get(e.produtoId) ?? (0 as Dinheiro), atuais[e.produtoId] ?? 0)));

  function salvar(substituir?: Record<string, number>) {
    const finais = { ...atuais, ...substituir };
    editar.mutate(
      estoques.map((e) => ({ produtoId: e.produtoId, quantidade: finais[e.produtoId] ?? 0 })),
      {
        onSuccess: () => router.push(voltar),
        onError: (erro) => {
          if (erro instanceof QuantidadeIndisponivel) {
            setExcesso({ produtoId: erro.produtoId, nome: erro.nome, solicitado: erro.solicitado, maximo: erro.maximo });
          }
        },
      },
    );
  }

  return (
    <Pagina>
      <CabecalhoDia sobretitulo={`Editar ${numeroPedido(pedido.numero)}`} data={pedido.cliente.nome} />
      <SeletorItens
        estoques={estoques}
        precos={precos}
        quantidades={atuais}
        aoMudar={(produtoId, n) => {
          setQuantidades({ ...atuais, [produtoId]: n });
          setExcesso(null);
          editar.reset();
        }}
        aoExceder={setExcesso}
      />
      {excesso && (
        <AvisoIndisponivel
          excesso={excesso}
          ocupado={editar.isPending}
          aoReservarMaximo={() => {
            const substituir = { [excesso.produtoId]: excesso.maximo };
            setQuantidades({ ...atuais, ...substituir });
            setExcesso(null);
            salvar(substituir);
          }}
          aoCancelar={() => setExcesso(null)}
        />
      )}
      {editar.error && !(editar.error instanceof QuantidadeIndisponivel) && <Aviso tom="critico">{mensagemDeErro(editar.error)}</Aviso>}
      <Cartao className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-ink-muted">Novo total</span>
          <span className="font-display text-numero-lg tabular-nums">{dinheiro(total)}</span>
        </div>
        <Botao bloco icone="check" disabled={!online || editar.isPending} onClick={() => salvar()}>
          {editar.isPending ? "Salvando…" : "Salvar pedido"}
        </Botao>
      </Cartao>
      <LinkBotao href={voltar} variante="fantasma" bloco>
        Voltar sem salvar
      </LinkBotao>
    </Pagina>
  );
}
