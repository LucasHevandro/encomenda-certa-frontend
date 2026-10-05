import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import { type EstoqueDoProduto, verificarItens } from "../../../domain/disponibilidade/Disponibilidade";
import type { Pedido } from "../../../domain/pedido/Pedido";
import type { PedidosGateway } from "../../portas/PedidosGateway";

export class ReativarPedido {
  constructor(private readonly pedidos: PedidosGateway) {}

  /**
   * Volta um pedido cancelado para reservado. Ele passa a segurar unidades de novo,
   * então confere com a tela antes (QuantidadeIndisponivel) e a API confere com a trava.
   */
  async executar(pedido: Pedido, estoquesNaTela?: readonly EstoqueDoProduto[]): Promise<Pedido> {
    if (pedido.retirada !== "cancelado") {
      throw new ErroDeDominio("pedido-nao-cancelado", "Só dá para reativar pedido cancelado.");
    }
    if (estoquesNaTela) verificarItens(estoquesNaTela, pedido.itens);
    return this.pedidos.reativar(pedido.id);
  }
}
