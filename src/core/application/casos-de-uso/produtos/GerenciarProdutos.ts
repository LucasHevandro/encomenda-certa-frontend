import type { Dinheiro } from "../../../domain/compartilhado/Dinheiro";
import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import type { Produto } from "../../../domain/produto/Produto";
import type { ProdutosGateway } from "../../portas/ProdutosGateway";

export class GerenciarProdutos {
  constructor(private readonly produtos: ProdutosGateway) {}

  listar(): Promise<Produto[]> {
    return this.produtos.listar();
  }

  criar(nome: string, preco: Dinheiro): Promise<Produto> {
    const limpo = nome.trim();
    if (limpo === "") throw new ErroDeDominio("produto-sem-nome", "Informe o nome do produto.");
    if (preco <= 0) throw new ErroDeDominio("preco-invalido", "Informe um preço maior que zero.");
    return this.produtos.criar({ nome: limpo, preco });
  }

  /** Mudar o preço não altera pedidos já feitos: cada item guarda o preço da época. */
  mudarPreco(produtoId: string, preco: Dinheiro): Promise<Produto> {
    if (preco <= 0) throw new ErroDeDominio("preco-invalido", "Informe um preço maior que zero.");
    return this.produtos.atualizar(produtoId, { preco });
  }

  /** Inativo some do novo pedido e do novo dia, mas fica no histórico. */
  ativar(produtoId: string, ativo: boolean): Promise<Produto> {
    return this.produtos.atualizar(produtoId, { ativo });
  }
}
