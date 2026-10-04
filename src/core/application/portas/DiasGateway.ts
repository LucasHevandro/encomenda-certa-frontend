import type { Dinheiro } from "../../domain/compartilhado/Dinheiro";
import type { DiaVenda } from "../../domain/dia-venda/DiaVenda";
import type { EstoqueDoProduto } from "../../domain/disponibilidade/Disponibilidade";

/** Linha da tela "Dias de venda". */
export interface ResumoDia {
  readonly dia: DiaVenda;
  readonly pedidos: number;
  readonly itensDisponiveis: number;
  /** Só para dias encerrados. */
  readonly faturamento?: Dinheiro;
  readonly sobras?: number;
}

/** Tudo o que a tela Início mostra. */
export interface PainelDoDia {
  readonly dia: DiaVenda;
  readonly estoques: readonly EstoqueDoProduto[];
  readonly pedidos: number;
  readonly itensReservados: number;
  readonly valorReservado: Dinheiro;
  readonly aguardandoRetirada: number;
  readonly proximoARetirar?: { readonly numero: number; readonly cliente: string };
  /** Clientes na lista de espera, por produto. */
  readonly clientesAguardando: Readonly<Record<string, number>>;
}

/** Apoio da tela "Novo dia de venda": último valor, média e sobra média por produto. */
export interface SugestaoProducao {
  readonly produtoId: string;
  readonly nome: string;
  readonly ultimo: number;
  readonly media: number;
  readonly sobraMedia: number;
}

export interface AbrirDia {
  readonly data: string;
  readonly producao: readonly { readonly produtoId: string; readonly quantidade: number }[];
}

export interface DiasGateway {
  listar(): Promise<ResumoDia[]>;
  obterPainel(diaId: string): Promise<PainelDoDia>;
  sugestaoProducao(): Promise<SugestaoProducao[]>;
  abrir(comando: AbrirDia): Promise<DiaVenda>;
  fechar(diaId: string): Promise<void>;
}
