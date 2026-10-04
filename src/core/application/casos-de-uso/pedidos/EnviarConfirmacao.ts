import type { DiaVenda } from "../../../domain/dia-venda/DiaVenda";
import type { Pedido } from "../../../domain/pedido/Pedido";
import type { Mensageiro } from "../../portas/Mensageiro";

export class EnviarConfirmacao {
  constructor(private readonly mensageiro: Mensageiro) {}

  /** Abre a mensagem pronta; quem envia é a pessoa, depois de conferir. */
  executar(pedido: Pedido, dia: DiaVenda): void {
    this.mensageiro.enviarConfirmacao(pedido, dia);
  }
}
