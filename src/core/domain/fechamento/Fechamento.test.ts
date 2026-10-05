import { describe, expect, it } from "vitest";
import { centavos } from "../compartilhado/Dinheiro";
import type { Pedido } from "../pedido/Pedido";
import { calcularFechamento, montarRelatorio } from "./Fechamento";

const item = (quantidade: number) => ({ produtoId: "frango", nome: "Frango", quantidade, precoUnitario: centavos(5500) });
const pedido = (numero: number, quantidade: number, retirada: Pedido["retirada"]): Pedido => ({
  id: `p${numero}`,
  numero,
  diaId: "d",
  cliente: { nome: "X" },
  itens: [item(quantidade)],
  retirada,
  pagamento: "pendente",
});

describe("calcularFechamento", () => {
  it("separa retirados, não retirados e sobras; cancelado não conta", () => {
    const fechamento = calcularFechamento(
      [{ produtoId: "frango", nome: "Frango", producao: 40, reservados: 3, vendidos: 5 }],
      [pedido(1, 5, "retirado"), pedido(2, 3, "reservado"), pedido(3, 2, "cancelado")],
    );
    expect(fechamento.produtos[0]).toMatchObject({ produzidos: 40, reservados: 8, retirados: 5, naoRetirados: 3, sobras: 32 });
    expect(fechamento.totalVendido).toBe(8 * 5500);
    expect(fechamento.valorNaoRetirado).toBe(3 * 5500);
    expect(fechamento.pedidos).toBe(2);
    expect(fechamento.pedidosNaoRetirados).toBe(1);
    expect(fechamento.itensVendidos).toBe(8);
  });
});

describe("montarRelatorio", () => {
  it("faz as médias por produto e o aproveitamento", () => {
    const foto = (produzidos: number, reservados: number, naoRetirados: number) => ({
      produtoId: "frango",
      nome: "Frango",
      produzidos,
      reservados,
      retirados: reservados - naoRetirados,
      naoRetirados,
      sobras: produzidos - reservados,
    });
    const relatorio = montarRelatorio([
      { diaId: "a", data: "2026-09-27", faturamento: centavos(100000), produtos: [foto(40, 36, 2)] },
      { diaId: "b", data: "2026-10-04", faturamento: centavos(200000), produtos: [foto(40, 40, 0)] },
    ]);
    expect(relatorio).toMatchObject({ dias: 2, faturamento: 300000, faturamentoMedio: 150000 });
    expect(relatorio.produtos[0]).toMatchObject({ mediaProduzida: 40, mediaVendida: 38, mediaSobras: 2, mediaNaoRetirados: 1, aproveitamento: 95 });
    expect(relatorio.produtos[0].porDia[0].data).toBe("2026-10-04");
  });
});
