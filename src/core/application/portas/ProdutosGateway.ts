import type { Dinheiro } from "../../domain/compartilhado/Dinheiro";
import type { Produto } from "../../domain/produto/Produto";

export interface ProdutosGateway {
  listar(): Promise<Produto[]>;
  criar(produto: { readonly nome: string; readonly preco: Dinheiro }): Promise<Produto>;
  atualizar(produtoId: string, mudancas: { readonly preco?: Dinheiro; readonly ativo?: boolean }): Promise<Produto>;
}
