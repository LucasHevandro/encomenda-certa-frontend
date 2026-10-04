import type { DiaVenda } from "../../../domain/dia-venda/DiaVenda";
import { calcularFechamento, type Fechamento } from "../../../domain/fechamento/Fechamento";
import type { DiasGateway } from "../../portas/DiasGateway";
import type { PedidosGateway } from "../../portas/PedidosGateway";

export class ObterFechamento {
  constructor(
    private readonly dias: DiasGateway,
    private readonly pedidos: PedidosGateway,
  ) {}

  /** O fechamento pode ser calculado a qualquer momento, antes ou depois de fechar. */
  async executar(diaId: string): Promise<{ dia: DiaVenda; fechamento: Fechamento }> {
    const [painel, pedidos] = await Promise.all([this.dias.obterPainel(diaId), this.pedidos.listar(diaId)]);
    return { dia: painel.dia, fechamento: calcularFechamento(painel.estoques, pedidos) };
  }
}
