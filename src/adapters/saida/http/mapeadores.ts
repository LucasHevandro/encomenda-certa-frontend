import { centavos, type Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import type { Pedido } from "@/core/domain/pedido/Pedido";
import type { Produto } from "@/core/domain/produto/Produto";

/**
 * Formato das respostas da API (JSON). Dinheiro chega em centavos (inteiro).
 * Os mapeadores marcam os valores com o tipo do domínio e conferem o que importa.
 */
export interface PedidoApi extends Omit<Pedido, "itens"> {
  itens: { produtoId: string; nome: string; quantidade: number; precoUnitario: number }[];
}

export interface ProdutoApi extends Omit<Produto, "preco"> {
  preco: number;
}

export const dinheiro = (valor: number): Dinheiro => centavos(valor);

export function paraPedido(api: PedidoApi): Pedido {
  return { ...api, itens: api.itens.map((i) => ({ ...i, precoUnitario: dinheiro(i.precoUnitario) })) };
}

export function paraProduto(api: ProdutoApi): Produto {
  return { ...api, preco: dinheiro(api.preco) };
}
