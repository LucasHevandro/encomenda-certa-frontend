export interface ClienteEncontrado {
  readonly id: string;
  readonly nome: string;
  readonly telefone?: string;
  readonly pedidosAnteriores: number;
}

export interface ClientesGateway {
  buscarPorTelefone(telefone: string): Promise<ClienteEncontrado | null>;
  listar(): Promise<ClienteEncontrado[]>;
}
