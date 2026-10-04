"use client";

import { useDeferredValue, useState } from "react";
import { estaPago, type Pedido, type Retirada, totalDoPedido } from "@/core/domain/pedido/Pedido";
import { Busca, CabecalhoDia, CartaoPedido, Carregando, FalhaAoCarregar, Filtros, LinkBotao, Pagina, Vazio } from "../../componentes";
import { dataLonga, dinheiro, numeroPedido, quantidadeDe } from "../../formatos";
import { usePainel, usePedidos } from "../../hooks/consultas";

type Filtro = "todos" | Retirada;

const ORDEM: Record<Retirada, number> = { reservado: 0, retirado: 1, cancelado: 2 };

/** Reservados primeiro (é o que importa durante a retirada), depois por número decrescente. */
function ordenar(pedidos: readonly Pedido[]): Pedido[] {
  return [...pedidos].sort((a, b) => ORDEM[a.retirada] - ORDEM[b.retirada] || b.numero - a.numero);
}

export function TelaPedidos({ diaId }: { diaId: string }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const buscaAdiada = useDeferredValue(busca.trim());
  const painel = usePainel(diaId);
  const pedidos = usePedidos(diaId, buscaAdiada ? { busca: buscaAdiada } : {});

  const todos = pedidos.data ?? [];
  const contar = (r: Retirada) => todos.filter((p) => p.retirada === r).length;
  const visiveis = ordenar(filtro === "todos" ? todos : todos.filter((p) => p.retirada === filtro));

  return (
    <Pagina>
      <CabecalhoDia
        sobretitulo="Pedidos"
        data={painel.data ? dataLonga(painel.data.dia.data) : "…"}
        acao={
          <span className="hidden tablet:contents desktop:hidden">
            <LinkBotao href={`/dias/${diaId}/pedidos/novo`} variante="primario" tamanho="md" icone="mais">
              Novo pedido
            </LinkBotao>
          </span>
        }
      />
      <div className="flex flex-col gap-3">
        <Busca valor={busca} aoMudar={setBusca} />
        <Filtros<Filtro>
          rotulo="Filtrar pedidos"
          ativo={filtro}
          aoMudar={setFiltro}
          opcoes={[
            { id: "todos", rotulo: "Todos", contagem: todos.length },
            { id: "reservado", rotulo: "Reservados", contagem: contar("reservado") },
            { id: "retirado", rotulo: "Retirados", contagem: contar("retirado") },
            { id: "cancelado", rotulo: "Cancelados", contagem: contar("cancelado") },
          ]}
        />
      </div>

      {pedidos.isPending ? (
        <Carregando />
      ) : pedidos.isError ? (
        <FalhaAoCarregar erro={pedidos.error} aoTentarDeNovo={() => pedidos.refetch()} />
      ) : visiveis.length === 0 ? (
        <Vazio>{buscaAdiada ? `Nenhum pedido encontrado para "${buscaAdiada}".` : "Nenhum pedido aqui ainda."}</Vazio>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 desktop:grid-cols-2">
          {visiveis.map((pedido) => (
            <li key={pedido.id}>
              <CartaoPedido
                href={`/dias/${diaId}/pedidos/${pedido.id}`}
                numero={numeroPedido(pedido.numero)}
                cliente={pedido.cliente.nome}
                itens={pedido.itens.map((i) => quantidadeDe(i.quantidade, i.nome))}
                total={dinheiro(totalDoPedido(pedido))}
                estado={pedido.retirada}
                pagamento={pedido.retirada === "cancelado" ? undefined : estaPago(pedido) ? "pago" : "naoPago"}
              />
            </li>
          ))}
        </ul>
      )}
    </Pagina>
  );
}
