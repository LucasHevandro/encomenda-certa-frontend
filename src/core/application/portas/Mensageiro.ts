import type { DiaVenda } from "../../domain/dia-venda/DiaVenda";
import type { Pedido } from "../../domain/pedido/Pedido";

export interface Mensageiro {
    /** Monta a confirmação (nome, número, itens, valor, data) e abre para a pessoa conferir e enviar. */
    enviarConfirmacao(pedido: Pedido, dia: DiaVenda): void;
}
