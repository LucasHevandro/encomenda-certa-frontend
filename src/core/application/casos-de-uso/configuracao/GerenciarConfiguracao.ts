import { type Configuracao, validarConfiguracao } from "../../../domain/configuracao/Configuracao";
import type { ConfiguracaoGateway } from "../../portas/ConfiguracaoGateway";

/** Marca, dias de venda, pagamentos e mensagem do WhatsApp de cada estabelecimento. */
export class GerenciarConfiguracao {
  constructor(private readonly configuracao: ConfiguracaoGateway) {}

  obter(): Promise<Configuracao> {
    return this.configuracao.obter();
  }

  /** Confere antes de enviar; a API confere de novo. */
  async salvar(nova: Configuracao): Promise<Configuracao> {
    return this.configuracao.salvar(validarConfiguracao(nova));
  }
}
