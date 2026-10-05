import { type Dinheiro, somar } from "../compartilhado/Dinheiro";
import { type Pedido, totalDoPedido } from "../pedido/Pedido";

export interface PedidoDoHistorico extends Pedido {
  /** Data do dia de venda (2026-10-04). */
  readonly data: string;
}

export interface ResumoDoCliente {
  readonly totalGasto: Dinheiro;
  readonly pedidos: number;
  /** Ainda reservados: de dias abertos ou que ficaram sem retirar. */
  readonly naoRetirados: number;
  /** Até 3 produtos que mais pede, em quantidade. */
  readonly favoritos: readonly { readonly produtoId: string; readonly nome: string; readonly quantidade: number }[];
}

/** Cancelados aparecem no histórico, mas não somam no total nem nos favoritos. */
export function resumirHistorico(pedidos: readonly Pedido[]): ResumoDoCliente {
  const validos = pedidos.filter((p) => p.retirada !== "cancelado");
  const porProduto = new Map<string, { produtoId: string; nome: string; quantidade: number }>();
  for (const pedido of validos) {
    for (const item of pedido.itens) {
      const atual = porProduto.get(item.produtoId) ?? { produtoId: item.produtoId, nome: item.nome, quantidade: 0 };
      porProduto.set(item.produtoId, { ...atual, quantidade: atual.quantidade + item.quantidade });
    }
  }
  return {
    totalGasto: somar(...validos.map(totalDoPedido)),
    pedidos: validos.length,
    naoRetirados: validos.filter((p) => p.retirada === "reservado").length,
    favoritos: [...porProduto.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, 3),
  };
}
