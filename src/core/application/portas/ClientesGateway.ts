import type { PedidoDoHistorico } from "../../domain/cliente/Historico";

export interface ClienteEncontrado {
  readonly id: string;
  readonly nome: string;
  readonly telefone?: string;
  readonly pedidosAnteriores: number;
}

export interface ClientesGateway {
  buscarPorTelefone(telefone: string): Promise<ClienteEncontrado | null>;
  listar(): Promise<ClienteEncontrado[]>;
  /** O cliente e todos os pedidos dele, do mais novo para o mais antigo. */
  historico(clienteId: string): Promise<{ cliente: ClienteEncontrado; pedidos: PedidoDoHistorico[] }>;
}
