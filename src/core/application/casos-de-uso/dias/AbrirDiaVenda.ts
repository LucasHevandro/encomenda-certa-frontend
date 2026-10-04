import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import { type DiaVenda, sugerirProximaData, validarNovaData } from "../../../domain/dia-venda/DiaVenda";
import type { AbrirDia, DiasGateway, SugestaoProducao } from "../../portas/DiasGateway";

export interface ProntoParaAbrir {
  /** Próximo domingo sem dia de venda. */
  readonly data: string;
  readonly existentes: readonly string[];
  /** Último valor, média de 4 dias e sobra média por produto: só apoio, nunca regra. */
  readonly sugestoes: readonly SugestaoProducao[];
}

export class AbrirDiaVenda {
  constructor(private readonly dias: DiasGateway) {}

  async preparar(hoje: string): Promise<ProntoParaAbrir> {
    const [resumos, sugestoes] = await Promise.all([this.dias.listar(), this.dias.sugestaoProducao()]);
    const existentes = resumos.map((r) => r.dia.data);
    return { data: sugerirProximaData(hoje, existentes), existentes, sugestoes };
  }

  executar(comando: AbrirDia, existentes: readonly string[] = []): Promise<DiaVenda> {
    validarNovaData(comando.data, existentes);
    if (comando.producao.some((p) => !Number.isInteger(p.quantidade) || p.quantidade < 0)) {
      throw new ErroDeDominio("producao-invalida", "Produção inválida.");
    }
    return this.dias.abrir(comando);
  }
}
