import type { DiasGateway } from "../../portas/DiasGateway";

export class FecharDia {
  constructor(private readonly dias: DiasGateway) {}

  /** Grava a foto do dia; depois disso ele só aceita leitura. */
  executar(diaId: string): Promise<void> {
    return this.dias.fechar(diaId);
  }
}
