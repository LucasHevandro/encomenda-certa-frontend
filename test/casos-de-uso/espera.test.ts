import { describe, expect, it } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { ListaDeEspera } from "@/core/application/casos-de-uso/espera/ListaDeEspera";

const DIA = "2026-10-04";

describe("ListaDeEspera", () => {
  it("entra no fim da fila do produto", async () => {
    const a = criarAdaptadoresEmMemoria();
    const caso = new ListaDeEspera(a.espera);
    const entrada = await caso.adicionar({ diaId: DIA, produtoId: "pernil", cliente: { nome: " Bia ", telefone: "(44) 91111-2222" }, quantidade: 1 });
    expect(entrada).toMatchObject({ posicao: 3, status: "aguardando", cliente: { nome: "Bia", telefone: "44911112222" } });
    expect((await a.dias.obterPainel(DIA)).clientesAguardando.pernil).toBe(3);
  });

  it("exige nome e pelo menos 1 unidade", () => {
    const caso = new ListaDeEspera(criarAdaptadoresEmMemoria().espera);
    expect(() => caso.adicionar({ diaId: DIA, produtoId: "pernil", cliente: { nome: "" }, quantidade: 1 })).toThrow("nome");
    expect(() => caso.adicionar({ diaId: DIA, produtoId: "pernil", cliente: { nome: "Bia" }, quantidade: 0 })).toThrow("1 unidade");
  });

  it("atendido sai da contagem de quem aguarda", async () => {
    const a = criarAdaptadoresEmMemoria();
    await new ListaDeEspera(a.espera).marcarAtendido("e1");
    expect((await a.dias.obterPainel(DIA)).clientesAguardando.pernil).toBe(1);
  });
});
