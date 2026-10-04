import { describe, expect, it } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { SalvarProducao } from "@/core/application/casos-de-uso/producao/SalvarProducao";
import { ProducaoAbaixoDoComprometido } from "@/core/domain/producao/Producao";

const DIA = "2026-10-04";

describe("SalvarProducao", () => {
  it("grava só o que mudou e registra o histórico", async () => {
    const a = criarAdaptadoresEmMemoria();
    const caso = new SalvarProducao(a.producao);
    const estoques = await caso.obter(DIA);
    await caso.executar(
      DIA,
      estoques.map((e) => ({ produtoId: e.produtoId, quantidade: e.produtoId === "frango" ? 45 : e.producao })),
      estoques,
    );
    expect((await caso.obter(DIA)).find((e) => e.produtoId === "frango")?.producao).toBe(45);
    expect(await caso.historico(DIA)).toEqual([expect.objectContaining({ produtoId: "frango", de: 40, para: 45 })]);
  });

  it("bloqueia abaixo de reservados + vendidos antes de enviar", async () => {
    const a = criarAdaptadoresEmMemoria();
    const caso = new SalvarProducao(a.producao);
    const estoques = await caso.obter(DIA); // pernil: 10 reservados
    await expect(caso.executar(DIA, [{ produtoId: "pernil", quantidade: 8 }], estoques)).rejects.toBeInstanceOf(ProducaoAbaixoDoComprometido);
    expect(await caso.historico(DIA)).toHaveLength(0);
  });

  it("a API também bloqueia, mesmo com números da tela desatualizados", async () => {
    const a = criarAdaptadoresEmMemoria();
    const caso = new SalvarProducao(a.producao);
    const telaAntiga = await caso.obter(DIA);
    await a.pedidos.criar({ diaId: DIA, cliente: { nome: "Ana" }, itens: [{ produtoId: "costela", quantidade: 10 }] });
    await expect(caso.executar(DIA, [{ produtoId: "costela", quantidade: 5 }], telaAntiga)).rejects.toMatchObject({
      codigo: "producao-abaixo-do-comprometido",
    });
  });
});
