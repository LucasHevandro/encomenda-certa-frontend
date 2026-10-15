import type { Dinheiro } from "../../domain/compartilhado/Dinheiro";
import type { ItemSolicitado } from "../../domain/disponibilidade/Disponibilidade";
import type { Retirada } from "../../domain/pedido/Pedido";

/** A vitrine pública de uma empresa: o que o cliente vê sem login. */
export interface Loja {
  readonly nome: string;
  readonly corPrincipal: string;
  readonly logoUrl?: string;
  readonly enderecoRetirada?: string;
  readonly aviso?: string;
  /** Falso: a empresa desligou os pedidos online. */
  readonly aceitandoPedidos: boolean;
  readonly maximoPorProduto: number;
  /** Dias abertos dentro do prazo, do mais próximo ao mais distante. */
  readonly dias: readonly DiaDaLoja[];
}

export interface DiaDaLoja {
  readonly id: string;
  readonly data: string;
  /** Até quando dá para pedir e cancelar (ISO). */
  readonly encerraEm: string;
  readonly produtos: readonly ProdutoDaLoja[];
}

export interface ProdutoDaLoja {
  readonly produtoId: string;
  readonly nome: string;
  readonly preco: Dinheiro;
  readonly disponiveis: number;
}

export interface ClienteDaLoja {
  readonly nome: string;
  readonly telefone: string;
}

export interface ReservaDaLoja {
  readonly diaId: string;
  readonly cliente: ClienteDaLoja;
  readonly itens: readonly ItemSolicitado[];
  /** Campo isca, escondido de quem usa a tela: só robô preenche, e a API recusa. */
  readonly site?: string;
}

/** O pedido visto pelo link do cliente: sem telefone, sem quem atendeu. */
export interface AcompanhamentoPedido {
  readonly numero: number;
  readonly cliente: string;
  readonly itens: readonly { nome: string; quantidade: number; precoUnitario: Dinheiro }[];
  readonly total: Dinheiro;
  readonly retirada: Retirada;
  readonly data: string;
  readonly estabelecimento: { readonly nome: string; readonly corPrincipal: string; readonly enderecoRetirada?: string; readonly endereco?: string };
  readonly cancelavelAte: string;
  readonly podeCancelar: boolean;
}

export interface LojaGateway {
  obter(endereco: string): Promise<Loja>;
  /** Lança QuantidadeIndisponivel quando não cabe. Devolve o código secreto do link do pedido. */
  reservar(endereco: string, reserva: ReservaDaLoja): Promise<{ codigo: string; numero: number }>;
  entrarNaEspera(endereco: string, entrada: { diaId: string; produtoId: string; cliente: ClienteDaLoja; quantidade: number }): Promise<void>;
  acompanhar(codigo: string): Promise<AcompanhamentoPedido>;
  cancelar(codigo: string): Promise<AcompanhamentoPedido>;
}
