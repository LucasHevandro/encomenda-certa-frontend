import type { Pedido } from "../../../domain/pedido/Pedido";
import type { PedidosGateway } from "../../portas/PedidosGateway";

export class ObterPedido {
  constructor(private readonly pedidos: PedidosGateway) {}

  executar(pedidoId: string): Promise<Pedido> {
    return this.pedidos.obter(pedidoId);
  }
}
