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

  /** `diasDeVenda` vem das configurações (0 = domingo … 6 = sábado). */
  async preparar(hoje: string, diasDeVenda: readonly number[] = [0]): Promise<ProntoParaAbrir> {
    const [resumos, sugestoes] = await Promise.all([this.dias.listar(), this.dias.sugestaoProducao()]);
    const existentes = resumos.map((r) => r.dia.data);
    // Com fim de semana, sugere o domingo, como antes; com outros dias, o próximo dia de venda livre.
    const preferidos = diasDeVenda.includes(0) && diasDeVenda.every((d) => d === 0 || d === 6) ? [0] : diasDeVenda;
    return { data: sugerirProximaData(hoje, existentes, preferidos), existentes, sugestoes };
  }

  executar(comando: AbrirDia, existentes: readonly string[] = [], diasDeVenda?: readonly number[]): Promise<DiaVenda> {
    validarNovaData(comando.data, existentes, diasDeVenda);
    if (comando.producao.some((p) => !Number.isInteger(p.quantidade) || p.quantidade < 0)) {
      throw new ErroDeDominio("producao-invalida", "Produção inválida.");
    }
    return this.dias.abrir(comando);
  }
}
