import type { Configuracao } from "../../domain/configuracao/Configuracao";
import type { DiaVenda } from "../../domain/dia-venda/DiaVenda";
import type { Pedido } from "../../domain/pedido/Pedido";

export interface Mensageiro {
  /** Monta a confirmação pelo modelo das configurações e abre para a pessoa conferir e enviar. */
  enviarConfirmacao(pedido: Pedido, dia: DiaVenda, configuracao: Configuracao): void;
}
