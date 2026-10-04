import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { ObterPainel } from "@/core/application/casos-de-uso/dias/ObterPainel";
import { CancelarPedido } from "@/core/application/casos-de-uso/pedidos/CancelarPedido";
import { CriarPedido } from "@/core/application/casos-de-uso/pedidos/CriarPedido";
import { ListarPedidos } from "@/core/application/casos-de-uso/pedidos/ListarPedidos";

/**
 * Único lugar que sabe quais adaptadores estão em uso.
 * Quando a API existir, troque aqui cada gateway em memória pelo HTTP (um de cada vez).
 */
export function criarContainer() {
  const saida = criarAdaptadoresEmMemoria({ atrasoMs: 250 });

  return {
    eventos: saida.eventos,
    mensageiro: saida.mensageiro,
    casos: {
      obterPainel: new ObterPainel(saida.dias),
      listarPedidos: new ListarPedidos(saida.pedidos),
      criarPedido: new CriarPedido(saida.pedidos),
      cancelarPedido: new CancelarPedido(saida.pedidos),
    },
  };
}

export type Container = ReturnType<typeof criarContainer>;
