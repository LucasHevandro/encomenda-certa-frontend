import type { Pedido } from "../../../domain/pedido/Pedido";
import type { PedidosGateway } from "../../portas/PedidosGateway";

export class MarcarRetirado {
  constructor(private readonly pedidos: PedidosGateway) {}

  /** Reservado vira retirado; a disponibilidade não muda. */
  executar(pedidoId: string): Promise<Pedido> {
    return this.pedidos.marcarRetirado(pedidoId);
  }
}
