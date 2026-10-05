import type { ItemSolicitado } from "../../domain/disponibilidade/Disponibilidade";
import type { ClienteDoPedido, Pagamento, Pedido, Retirada } from "../../domain/pedido/Pedido";

export interface NovoPedido {
  readonly diaId: string;
  readonly cliente: ClienteDoPedido;
  readonly itens: readonly ItemSolicitado[];
}

export interface FiltroPedidos {
  readonly retirada?: Retirada;
  /** Nome, telefone ou número do pedido. */
  readonly busca?: string;
}

export interface ResultadoCancelamento {
  readonly unidadesLiberadas: number;
  /** Clientes na lista de espera dos produtos liberados. */
  readonly clientesAguardando: number;
}

export interface PedidosGateway {
  listar(diaId: string, filtro?: FiltroPedidos): Promise<Pedido[]>;
  obter(pedidoId: string): Promise<Pedido>;
  /** Lança QuantidadeIndisponivel quando não cabe. */
  criar(pedido: NovoPedido): Promise<Pedido>;
  editarItens(pedidoId: string, itens: readonly ItemSolicitado[]): Promise<Pedido>;
  marcarRetirado(pedidoId: string): Promise<Pedido>;
  registrarPagamento(pedidoId: string, pagamento: Pagamento): Promise<Pedido>;
  cancelar(pedidoId: string): Promise<ResultadoCancelamento>;
  /** Volta um cancelado para reservado. Lança QuantidadeIndisponivel quando não cabe mais. */
  reativar(pedidoId: string): Promise<Pedido>;
}
