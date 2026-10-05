"use client";

import { estaPago, totalDoPedido } from "@/core/domain/pedido/Pedido";
import { CartaoPedido, Carregando, FalhaAoCarregar, LinkBotao, Pagina, Resumo, Secao, Vazio } from "../../componentes";
import { dataCurta, dinheiro, dinheiroCurto, numeroPedido, quantidadeDe, telefone } from "../../formatos";
import { useHistoricoCliente } from "../../hooks/consultas";

/** Quem é o cliente para o balcão: quanto já comprou, o que costuma pedir e os pedidos anteriores. */
export function TelaCliente({ clienteId }: { clienteId: string }) {
  const historico = useHistoricoCliente(clienteId);

  if (historico.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (historico.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={historico.error} aoTentarDeNovo={() => historico.refetch()} />
      </Pagina>
    );
  }

  const { cliente, pedidos, resumo } = historico.data;

  return (
    <Pagina>
      <header className="pt-6">
        <p className="m-0 mb-0.5 text-rotulo tracking-[.06em] text-brasa uppercase">Cliente</p>
        <h1 className="m-0 font-display text-display">{cliente.nome}</h1>
        {cliente.telefone && <p className="m-0 mt-1 text-ink-muted">{telefone(cliente.telefone)}</p>}
      </header>

      <Resumo
        itens={[
          { valor: dinheiroCurto(resumo.totalGasto), rotulo: "já comprou" },
          { valor: resumo.pedidos, rotulo: resumo.pedidos === 1 ? "pedido" : "pedidos" },
        ]}
      />

      {resumo.favoritos.length > 0 && (
        <Secao titulo="Costuma pedir">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {resumo.favoritos.map((f) => (
              <li key={f.produtoId} className="rounded-full bg-surface-sunken px-3 py-1.5 text-rotulo">
                {quantidadeDe(f.quantidade, f.nome)}
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao titulo="Pedidos">
        {resumo.naoRetirados > 0 && (
          <p className="m-0 text-ink-muted">
            {resumo.naoRetirados === 1 ? "1 pedido ainda reservado." : `${resumo.naoRetirados} pedidos ainda reservados.`}
          </p>
        )}
        {pedidos.length === 0 ? (
          <Vazio>Nenhum pedido ainda.</Vazio>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {pedidos.map((pedido) => (
              <li key={pedido.id} className="flex flex-col gap-1">
                <span className="text-rotulo text-ink-muted">{dataCurta(pedido.data)}</span>
                <CartaoPedido
                  href={`/dias/${pedido.diaId}/pedidos/${pedido.id}`}
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
      </Secao>

      <LinkBotao href="/clientes" variante="fantasma" bloco>
        Voltar aos clientes
      </LinkBotao>
    </Pagina>
  );
}
