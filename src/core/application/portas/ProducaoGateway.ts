import type { EstoqueDoProduto } from "../../domain/disponibilidade/Disponibilidade";

export interface AlteracaoProducao {
  readonly produtoId: string;
  readonly de: number;
  readonly para: number;
  readonly em: string;
  readonly usuario: string;
}

export interface ProducaoGateway {
  obter(diaId: string): Promise<EstoqueDoProduto[]>;
  /** Lança ProducaoAbaixoDoComprometido quando alguma quantidade fica abaixo do reservado. */
  salvar(diaId: string, quantidades: readonly { readonly produtoId: string; readonly quantidade: number }[]): Promise<void>;
  historico(diaId: string): Promise<AlteracaoProducao[]>;
}
