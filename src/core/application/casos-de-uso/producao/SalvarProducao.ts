import type { EstoqueDoProduto } from "../../../domain/disponibilidade/Disponibilidade";
import { validarNovaProducao } from "../../../domain/producao/Producao";
import type { AlteracaoProducao, ProducaoGateway } from "../../portas/ProducaoGateway";

export interface NovaProducao {
  readonly produtoId: string;
  readonly quantidade: number;
}

export class SalvarProducao {
  constructor(private readonly producao: ProducaoGateway) {}

  obter(diaId: string): Promise<EstoqueDoProduto[]> {
    return this.producao.obter(diaId);
  }

  historico(diaId: string): Promise<AlteracaoProducao[]> {
    return this.producao.historico(diaId);
  }

  /**
   * Confere com os números da tela antes de enviar (lança ProducaoAbaixoDoComprometido)
   * e manda só o que mudou. A API confere de novo com a produção travada.
   */
  async executar(diaId: string, novas: readonly NovaProducao[], estoquesNaTela: readonly EstoqueDoProduto[]): Promise<void> {
    const mudancas = novas.filter((n) => {
      const estoque = estoquesNaTela.find((e) => e.produtoId === n.produtoId);
      if (!estoque) return false;
      validarNovaProducao(estoque, n.quantidade);
      return estoque.producao !== n.quantidade;
    });
    if (mudancas.length === 0) return;
    await this.producao.salvar(diaId, mudancas);
  }
}
