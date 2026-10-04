import { type EstoqueDoProduto, verificarItens } from "../../../domain/disponibilidade/Disponibilidade";
import { type Pedido, validarNovoPedido } from "../../../domain/pedido/Pedido";
import type { NovoPedido, PedidosGateway } from "../../portas/PedidosGateway";

export class CriarPedido {
  constructor(private readonly pedidos: PedidosGateway) {}

  /**
   * `estoquesNaTela` são os números que a pessoa está vendo: com eles o aviso
   * "Quantidade indisponível" aparece sem esperar a API. A API confere de novo.
   */
  async executar(comando: NovoPedido, estoquesNaTela?: readonly EstoqueDoProduto[]): Promise<Pedido> {
    const itens = comando.itens.filter((item) => item.quantidade > 0);
    const cliente = { nome: comando.cliente.nome.trim(), telefone: comando.cliente.telefone?.replace(/\D/g, "") || undefined };
    validarNovoPedido(cliente, itens);
    if (estoquesNaTela) verificarItens(estoquesNaTela, itens);
    return this.pedidos.criar({ diaId: comando.diaId, cliente, itens });
  }
}
