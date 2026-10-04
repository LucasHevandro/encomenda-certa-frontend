import type { PedidosGateway, ResultadoCancelamento } from "../../portas/PedidosGateway";

export class CancelarPedido {
  constructor(private readonly pedidos: PedidosGateway) {}

  /** Devolve as unidades para venda e diz se há clientes na lista de espera desses produtos. */
  executar(pedidoId: string): Promise<ResultadoCancelamento> {
    return this.pedidos.cancelar(pedidoId);
  }
}
