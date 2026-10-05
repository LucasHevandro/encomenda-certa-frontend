import { centavos, type Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import type { Pedido } from "@/core/domain/pedido/Pedido";
import type { Produto } from "@/core/domain/produto/Produto";
import type { Esquema } from "./apiTipada";

/**
 * Respostas da API (tipos gerados do openapi.json) → objetos do domínio.
 * Dinheiro chega em centavos (inteiro) e ganha a marca do tipo Dinheiro aqui.
 */

export const dinheiro = (valor: number): Dinheiro => centavos(valor);

export function paraPedido(api: Esquema<"Pedido">): Pedido {
  return { ...api, itens: api.itens.map((i) => ({ ...i, precoUnitario: dinheiro(i.precoUnitario) })) };
}

export function paraProduto(api: Esquema<"Produto">): Produto {
  return { ...api, preco: dinheiro(api.preco) };
}
