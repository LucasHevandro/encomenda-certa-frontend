import { describe, expect, it } from "vitest";
import { centavos } from "../compartilhado/Dinheiro";
import type { Pedido } from "../pedido/Pedido";
import { resumirHistorico } from "./Historico";

const pedido = (retirada: Pedido["retirada"], itens: [string, number][]): Pedido => ({
  id: Math.random().toString(),
  numero: 1,
  diaId: "d",
  cliente: { nome: "Joana" },
  itens: itens.map(([nome, quantidade]) => ({ produtoId: nome, nome, quantidade, precoUnitario: centavos(1000) })),
  retirada,
  pagamento: "pendente",
});

describe("resumirHistorico", () => {
  it("soma o que não foi cancelado e ordena os favoritos", () => {
    const resumo = resumirHistorico([
      pedido("retirado", [["Costela", 2]]),
      pedido("reservado", [["Costela", 1], ["Farofa", 1]]),
      pedido("cancelado", [["Farofa", 5]]),
    ]);
    expect(resumo).toMatchObject({ totalGasto: 4000, pedidos: 2, naoRetirados: 1 });
    expect(resumo.favoritos).toEqual([
      { produtoId: "Costela", nome: "Costela", quantidade: 3 },
      { produtoId: "Farofa", nome: "Farofa", quantidade: 1 },
    ]);
  });
});
