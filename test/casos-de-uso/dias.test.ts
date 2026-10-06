import { describe, expect, it } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { AbrirDiaVenda } from "@/core/application/casos-de-uso/dias/AbrirDiaVenda";
import { FecharDia } from "@/core/application/casos-de-uso/dias/FecharDia";
import { ObterFechamento } from "@/core/application/casos-de-uso/dias/ObterFechamento";

describe("AbrirDiaVenda", () => {
  it("sugere o próximo domingo livre e a produção do histórico", async () => {
    const a = criarAdaptadoresEmMemoria();
    const pronto = await new AbrirDiaVenda(a.dias).preparar("2026-10-01");
    expect(pronto.data).toBe("2026-10-18"); // 04/10 e 11/10 já existem
    expect(pronto.sugestoes.find((s) => s.produtoId === "frango")).toMatchObject({ ultimo: 40, media: 38 });
  });

  it("abre o dia com a produção escolhida", async () => {
    const a = criarAdaptadoresEmMemoria();
    const caso = new AbrirDiaVenda(a.dias);
    const dia = await caso.executar({ data: "2026-10-17", producao: [{ produtoId: "frango", quantidade: 30 }] }, ["2026-10-04"]);
    const painel = await a.dias.obterPainel(dia.id);
    expect(painel.estoques).toEqual([expect.objectContaining({ produtoId: "frango", producao: 30 })]);
  });

  it("recusa dia útil e data repetida", async () => {
    const a = criarAdaptadoresEmMemoria();
    const caso = new AbrirDiaVenda(a.dias);
    expect(() => caso.executar({ data: "2026-10-14", producao: [] })).toThrow("sábado ou domingo");
    await expect(a.dias.abrir({ data: "2026-10-04", producao: [] })).rejects.toMatchObject({ codigo: "dia-ja-existe" });
  });
});

describe("Fechamento", () => {
  it("calcula a qualquer momento e, depois de fechar, o dia vira somente leitura", async () => {
    const a = criarAdaptadoresEmMemoria();
    const { fechamento } = await new ObterFechamento(a.dias, a.pedidos).executar("2026-10-04");
    expect(fechamento.pedidosNaoRetirados).toBe(4);
    await new FecharDia(a.dias).executar("2026-10-04");
    const resumo = (await a.dias.listar()).find((r) => r.dia.id === "2026-10-04");
    expect(resumo?.dia.status).toBe("encerrado");
    expect(resumo?.faturamento).toBe(fechamento.totalVendido);
    await expect(a.producao.salvar("2026-10-04", [{ produtoId: "frango", quantidade: 50 }])).rejects.toMatchObject({ codigo: "dia-encerrado" });
  });
});
