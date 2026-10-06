import type { Configuracao } from "../../../domain/configuracao/Configuracao";
import type { DiaVenda } from "../../../domain/dia-venda/DiaVenda";
import type { Pedido } from "../../../domain/pedido/Pedido";
import type { Mensageiro } from "../../portas/Mensageiro";

export class EnviarConfirmacao {
  constructor(private readonly mensageiro: Mensageiro) {}

  /**
   * Abre a mensagem pronta; quem envia é a pessoa, depois de conferir.
   * Síncrono de propósito: o navegador só abre o WhatsApp direto do toque, sem esperar a rede.
   */
  executar(pedido: Pedido, dia: DiaVenda, configuracao: Configuracao): void {
    this.mensageiro.enviarConfirmacao(pedido, dia, configuracao);
  }
}
