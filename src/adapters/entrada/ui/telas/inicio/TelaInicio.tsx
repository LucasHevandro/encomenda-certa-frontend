"use client";

import Link from "next/link";
import { disponiveis } from "@/core/domain/disponibilidade/Disponibilidade";
import { estaAberto } from "@/core/domain/dia-venda/DiaVenda";
import { totalDoPedido } from "@/core/domain/pedido/Pedido";
import {
  Aviso,
  CabecalhoDia,
  CartaoProduto,
  Carregando,
  FalhaAoCarregar,
  GrupoLista,
  ItemLista,
  LinkBotao,
  Pagina,
  Resumo,
  Secao,
  Status,
  Vazio,
} from "../../componentes";
import { dataLonga, dinheiro, dinheiroCurto, numeroPedido, quantidadeDe, rotuloDoDia } from "../../formatos";
import { useConfiguracao, usePainel, usePedidos } from "../../hooks/consultas";

/** Início do dia: quanto ainda posso vender, quanto está reservado e quem ainda vai buscar. */
export function TelaInicio({ diaId }: { diaId: string }) {
  const painel = usePainel(diaId);
  const pendentes = usePedidos(diaId, { retirada: "reservado" });
  const { limiteAtencao } = useConfiguracao();
  const base = `/dias/${diaId}`;

  if (painel.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando linhas={4} />
      </Pagina>
    );
  }
  if (painel.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={painel.error} aoTentarDeNovo={() => painel.refetch()} />
      </Pagina>
    );
  }

  const { dia, estoques, clientesAguardando } = painel.data;
  const totalDisponivel = estoques.reduce((total, e) => total + disponiveis(e), 0);
  const aberto = estaAberto(dia);
  const aRetirar = [...(pendentes.data ?? [])].sort((a, b) => a.numero - b.numero);

  return (
    <Pagina larga>
      <CabecalhoDia
        sobretitulo={aberto ? rotuloDoDia(dia.data) : "Dia fechado"}
        data={dataLonga(dia.data)}
        acao={
          <div className="flex gap-2">
            <LinkBotao href="/dias" variante="fantasma" tamanho="md">
              Trocar dia
            </LinkBotao>
            {aberto && (
              <span className="hidden tablet:contents desktop:hidden">
                <LinkBotao href={`${base}/pedidos/novo`} variante="primario" tamanho="md" icone="mais">
                  Novo pedido
                </LinkBotao>
              </span>
            )}
          </div>
        }
      />

      {!aberto && (
        <Aviso
          tom="info"
          icone="check"
          titulo="Este dia já foi fechado"
          acoes={
            <LinkBotao href={`${base}/fechamento`} tamanho="md">
              Ver fechamento
            </LinkBotao>
          }
        >
          Os números abaixo são só para consulta.
        </Aviso>
      )}

      <Resumo
        itens={[
          { valor: totalDisponivel, rotulo: totalDisponivel === 1 ? "item disponível" : "itens disponíveis", destaque: true },
          { valor: painel.data.pedidos, rotulo: painel.data.pedidos === 1 ? "pedido" : "pedidos" },
          { valor: painel.data.itensReservados, rotulo: painel.data.itensReservados === 1 ? "item reservado" : "itens reservados" },
          { valor: dinheiroCurto(painel.data.valorReservado), rotulo: "reservados" },
        ]}
      />

      <div className="grid gap-6 tablet:grid-cols-[minmax(0,1fr)_minmax(0,320px)] desktop:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <Secao titulo="Produtos">
          {estoques.length === 0 ? (
            <Vazio
              acao={
                <LinkBotao href={`${base}/producao`} tamanho="md">
                  Definir produção
                </LinkBotao>
              }
            >
              Nenhum produto neste dia ainda.
            </Vazio>
          ) : (
            <div className="grid gap-3 tablet:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
              {estoques.map((estoque) => {
                const naFila = clientesAguardando[estoque.produtoId] ?? 0;
                return (
                  <CartaoProduto key={estoque.produtoId} limiteAtencao={limiteAtencao} nome={estoque.nome} producao={estoque.producao} reservados={estoque.reservados} vendidos={estoque.vendidos}>
                    {naFila > 0 && (
                      <Link href={`${base}/espera`} className="inline-flex">
                        <Status estado="espera">{naFila === 1 ? "1 cliente aguardando" : `${naFila} clientes aguardando`}</Status>
                      </Link>
                    )}
                  </CartaoProduto>
                );
              })}
            </div>
          )}
        </Secao>

        <Secao
          titulo="Quem ainda vai buscar"
          acao={
            <Link href={`${base}/pedidos`} className="text-rotulo text-brasa">
              Ver todos
            </Link>
          }
        >
          {painel.data.proximoARetirar && (
            <p className="m-0 text-ink-muted">
              Próximo: <strong className="text-ink">{numeroPedido(painel.data.proximoARetirar.numero)}</strong> · {painel.data.proximoARetirar.cliente}
            </p>
          )}
          {aRetirar.length === 0 ? (
            <Vazio>Nenhum pedido aguardando retirada.</Vazio>
          ) : (
            <GrupoLista>
              {aRetirar.slice(0, 8).map((pedido) => (
                <ItemLista
                  key={pedido.id}
                  href={`${base}/pedidos/${pedido.id}`}
                  titulo={`${numeroPedido(pedido.numero)} · ${pedido.cliente.nome}`}
                  subtitulo={pedido.itens.map((i) => quantidadeDe(i.quantidade, i.nome)).join(", ")}
                  direita={dinheiro(totalDoPedido(pedido))}
                />
              ))}
            </GrupoLista>
          )}
          {aRetirar.length > 8 && (
            <LinkBotao href={`${base}/pedidos`} bloco tamanho="md">
              Ver mais {aRetirar.length - 8} pedidos
            </LinkBotao>
          )}
        </Secao>
      </div>
    </Pagina>
  );
}
