import { montarRelatorio, type Relatorio } from "../../../domain/fechamento/Fechamento";
import type { DiasGateway } from "../../portas/DiasGateway";

export class RelatorioEntreDias {
  constructor(private readonly dias: DiasGateway) {}

  /** Médias por produto nos últimos `dias` dias fechados. Apoio para a produção, nunca regra. */
  async executar(dias: number): Promise<Relatorio> {
    return montarRelatorio(await this.dias.relatorio(dias));
  }
}
