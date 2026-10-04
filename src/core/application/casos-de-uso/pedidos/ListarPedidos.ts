import type { Pedido } from "../../../domain/pedido/Pedido";
import type { FiltroPedidos, PedidosGateway } from "../../portas/PedidosGateway";

export class ListarPedidos {
  constructor(private readonly pedidos: PedidosGateway) {}

  executar(diaId: string, filtro?: FiltroPedidos): Promise<Pedido[]> {
    return this.pedidos.listar(diaId, filtro);
  }
}
