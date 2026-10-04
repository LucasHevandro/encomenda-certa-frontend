import type { Pagamento, Pedido } from "../../../domain/pedido/Pedido";
import type { PedidosGateway } from "../../portas/PedidosGateway";

export class RegistrarPagamento {
  constructor(private readonly pedidos: PedidosGateway) {}

  /** Independente da retirada: dá para pagar antes ou depois de buscar. */
  executar(pedidoId: string, pagamento: Pagamento): Promise<Pedido> {
    return this.pedidos.registrarPagamento(pedidoId, pagamento);
  }
}
