import type { ClienteEncontrado, ClientesGateway } from "../../portas/ClientesGateway";

/** Telefone com DDD tem 10 ou 11 dígitos; antes disso não vale perguntar à API. */
export const DIGITOS_MINIMOS_TELEFONE = 10;

export class BuscarClientes {
  constructor(private readonly clientes: ClientesGateway) {}

  async porTelefone(telefone: string): Promise<ClienteEncontrado | null> {
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length < DIGITOS_MINIMOS_TELEFONE) return null;
    return this.clientes.buscarPorTelefone(digitos);
  }

  listar(): Promise<ClienteEncontrado[]> {
    return this.clientes.listar();
  }
}
