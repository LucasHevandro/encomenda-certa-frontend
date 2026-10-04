import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import type { EntradaEspera } from "../../../domain/lista-espera/EntradaEspera";
import type { EsperaGateway } from "../../portas/EsperaGateway";

export interface NovaEntradaEspera {
  readonly diaId: string;
  readonly produtoId: string;
  readonly cliente: { readonly nome: string; readonly telefone?: string };
  readonly quantidade: number;
}

export class ListaDeEspera {
  constructor(private readonly espera: EsperaGateway) {}

  listar(diaId: string): Promise<EntradaEspera[]> {
    return this.espera.listar(diaId);
  }

  /** Entra no fim da fila do produto. */
  adicionar(entrada: NovaEntradaEspera): Promise<EntradaEspera> {
    const nome = entrada.cliente.nome.trim();
    if (nome === "") throw new ErroDeDominio("cliente-sem-nome", "Informe o nome do cliente.");
    if (!Number.isInteger(entrada.quantidade) || entrada.quantidade < 1) {
      throw new ErroDeDominio("quantidade-invalida", "Escolha pelo menos 1 unidade.");
    }
    const telefone = entrada.cliente.telefone?.replace(/\D/g, "") || undefined;
    return this.espera.adicionar({ ...entrada, cliente: { nome, telefone } });
  }

  marcarAtendido(entradaId: string): Promise<EntradaEspera> {
    return this.espera.mudarStatus(entradaId, "atendido");
  }

  marcarDesistiu(entradaId: string): Promise<EntradaEspera> {
    return this.espera.mudarStatus(entradaId, "desistiu");
  }
}
