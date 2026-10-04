import type { DiasGateway, PainelDoDia } from "../../portas/DiasGateway";

export class ObterPainel {
  constructor(private readonly dias: DiasGateway) {}

  executar(diaId: string): Promise<PainelDoDia> {
    return this.dias.obterPainel(diaId);
  }
}
