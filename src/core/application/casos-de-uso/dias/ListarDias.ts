import type { DiasGateway, ResumoDia } from "../../portas/DiasGateway";

export class ListarDias {
  constructor(private readonly dias: DiasGateway) {}

  executar(): Promise<ResumoDia[]> {
    return this.dias.listar();
  }
}
