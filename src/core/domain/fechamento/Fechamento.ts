import { centavos, type Dinheiro, somar } from "../compartilhado/Dinheiro";
import { disponiveis, type EstoqueDoProduto } from "../disponibilidade/Disponibilidade";
import { type Pedido, totalDoPedido } from "../pedido/Pedido";

/** Uma linha do fechamento: o que aconteceu com cada produto no dia. */
export interface FechamentoDoProduto {
  readonly produtoId: string;
  readonly nome: string;
  readonly produzidos: number;
  /** Todos os itens de pedidos não cancelados, retirados ou não. */
  readonly reservados: number;
  readonly retirados: number;
  readonly naoRetirados: number;
  /** Produção que ninguém reservou. Não retirado não conta como sobra. */
  readonly sobras: number;
}

export interface Fechamento {
  readonly produtos: readonly FechamentoDoProduto[];
  /** Decisão do negócio: soma todos os pedidos não cancelados, retirados ou não. */
  readonly totalVendido: Dinheiro;
  /** Parte do total que ainda não foi retirada. */
  readonly valorNaoRetirado: Dinheiro;
  readonly pedidos: number;
  readonly pedidosNaoRetirados: number;
  readonly itensVendidos: number;
  readonly sobras: number;
}

export function calcularFechamento(estoques: readonly EstoqueDoProduto[], pedidos: readonly Pedido[]): Fechamento {
  const validos = pedidos.filter((p) => p.retirada !== "cancelado");
  const naoRetirados = validos.filter((p) => p.retirada === "reservado");
  const produtos = estoques.map((e) => ({
    produtoId: e.produtoId,
    nome: e.nome,
    produzidos: e.producao,
    reservados: e.reservados + e.vendidos,
    retirados: e.vendidos,
    naoRetirados: e.reservados,
    sobras: disponiveis(e),
  }));
  return {
    produtos,
    totalVendido: somar(...validos.map(totalDoPedido)),
    valorNaoRetirado: somar(...naoRetirados.map(totalDoPedido)),
    pedidos: validos.length,
    pedidosNaoRetirados: naoRetirados.length,
    itensVendidos: produtos.reduce((total, p) => total + p.reservados, 0),
    sobras: produtos.reduce((total, p) => total + p.sobras, 0),
  };
}

/** Foto de um dia já fechado, para o relatório entre dias. */
export interface DiaFechado {
  readonly diaId: string;
  readonly data: string;
  readonly faturamento: Dinheiro;
  readonly produtos: readonly FechamentoDoProduto[];
}

export interface DesempenhoDoProduto {
  readonly produtoId: string;
  readonly nome: string;
  /** Em quantos dias o produto apareceu. */
  readonly dias: number;
  readonly mediaProduzida: number;
  /** Vendidos = reservados (retirados ou não), como no total vendido. */
  readonly mediaVendida: number;
  readonly mediaSobras: number;
  readonly mediaNaoRetirados: number;
  /** Quanto da produção foi vendido, de 0 a 100. */
  readonly aproveitamento: number;
  /** Do mais recente para o mais antigo. */
  readonly porDia: readonly { readonly data: string; readonly produzidos: number; readonly vendidos: number; readonly sobras: number }[];
}

export interface Relatorio {
  readonly dias: number;
  readonly faturamento: Dinheiro;
  readonly faturamentoMedio: Dinheiro;
  readonly produtos: readonly DesempenhoDoProduto[];
}

const media = (valores: readonly number[]) => (valores.length ? Math.round((valores.reduce((t, v) => t + v, 0) / valores.length) * 10) / 10 : 0);

/** Médias por produto ao longo dos dias fechados: apoio para decidir a produção, nunca regra. */
export function montarRelatorio(diasFechados: readonly DiaFechado[]): Relatorio {
  const ordenados = [...diasFechados].sort((a, b) => b.data.localeCompare(a.data));
  const ids = [...new Set(ordenados.flatMap((d) => d.produtos.map((p) => p.produtoId)))];
  const produtos = ids.map((produtoId) => {
    const linhas = ordenados.flatMap((d) => d.produtos.filter((p) => p.produtoId === produtoId).map((p) => ({ ...p, data: d.data })));
    const produzidos = linhas.reduce((t, l) => t + l.produzidos, 0);
    const vendidos = linhas.reduce((t, l) => t + l.reservados, 0);
    return {
      produtoId,
      nome: linhas[0].nome,
      dias: linhas.length,
      mediaProduzida: media(linhas.map((l) => l.produzidos)),
      mediaVendida: media(linhas.map((l) => l.reservados)),
      mediaSobras: media(linhas.map((l) => l.sobras)),
      mediaNaoRetirados: media(linhas.map((l) => l.naoRetirados)),
      aproveitamento: produzidos ? Math.round((vendidos / produzidos) * 100) : 0,
      porDia: linhas.map((l) => ({ data: l.data, produzidos: l.produzidos, vendidos: l.reservados, sobras: l.sobras })),
    };
  });
  const faturamento = somar(...ordenados.map((d) => d.faturamento));
  return {
    dias: ordenados.length,
    faturamento,
    faturamentoMedio: centavos(ordenados.length ? Math.round(faturamento / ordenados.length) : 0),
    produtos: produtos.sort((a, b) => a.nome.localeCompare(b.nome)),
  };
}
