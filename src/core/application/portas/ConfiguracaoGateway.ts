import type { Configuracao } from "../../domain/configuracao/Configuracao";

export interface ConfiguracaoGateway {
  obter(): Promise<Configuracao>;
  salvar(configuracao: Configuracao): Promise<Configuracao>;
}
