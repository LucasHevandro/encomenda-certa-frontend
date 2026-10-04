import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import { type EstoqueDoProduto, type ItemSolicitado, verificarItens } from "../../../domain/disponibilidade/Disponibilidade";
import { estaAberto, type Pedido, validarNovoPedido } from "../../../domain/pedido/Pedido";
import type { PedidosGateway } from "../../portas/PedidosGateway";

export class EditarPedido {
  constructor(private readonly pedidos: PedidosGateway) {}

  /**
   * As unidades que o próprio pedido já segura voltam para a conta antes de conferir,
   * então só o que aumentou precisa caber no disponível.
   */
  async executar(pedido: Pedido, itens: readonly ItemSolicitado[], estoquesNaTela?: readonly EstoqueDoProduto[]): Promise<Pedido> {
    if (!estaAberto(pedido)) {
      throw new ErroDeDominio("pedido-fechado", "Só dá para editar pedido reservado.");
    }
    const comQuantidade = itens.filter((i) => i.quantidade > 0);
    validarNovoPedido(pedido.cliente, comQuantidade);
    if (estoquesNaTela) verificarItens(devolverUnidades(estoquesNaTela, pedido), comQuantidade);
    return this.pedidos.editarItens(pedido.id, comQuantidade);
  }
}

/** Estoques como se o pedido não existisse: o que ele reservou volta a ficar disponível. */
export function devolverUnidades(estoques: readonly EstoqueDoProduto[], pedido: Pedido): EstoqueDoProduto[] {
  return estoques.map((e) => ({
    ...e,
    reservados: e.reservados - pedido.itens.filter((i) => i.produtoId === e.produtoId).reduce((t, i) => t + i.quantidade, 0),
  }));
}
