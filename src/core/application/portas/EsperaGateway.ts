import type { EntradaEspera } from "../../domain/lista-espera/EntradaEspera";

export interface EsperaGateway {
  listar(diaId: string): Promise<EntradaEspera[]>;
  adicionar(entrada: Pick<EntradaEspera, "diaId" | "produtoId" | "cliente" | "quantidade">): Promise<EntradaEspera>;
}
