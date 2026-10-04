import { describe, expect, it } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import type { EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import { disponiveis, QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { CancelarPedido } from "@/core/application/casos-de-uso/pedidos/CancelarPedido";
import { CriarPedido } from "@/core/application/casos-de-uso/pedidos/CriarPedido";

const DIA = "2026-10-04";

function montar() {
  const a = criarAdaptadoresEmMemoria();
  const frango = async () => (await a.dias.obterPainel(DIA)).estoques.find((e) => e.produtoId === "frango")!;
  return { a, frango, criar: new CriarPedido(a.pedidos), cancelar: new CancelarPedido(a.pedidos) };
}

describe("CriarPedido", () => {
  it("reserva e reduz o disponível na hora", async () => {
    const { a, frango, criar } = montar();
    const antes = disponiveis(await frango());
    const pedido = await criar.executar({ diaId: DIA, cliente: { nome: " Maria ", telefone: "(44) 98888-7777" }, itens: [{ produtoId: "frango", quantidade: 2 }] });
    expect(pedido.retirada).toBe("reservado");
    expect(pedido.cliente).toEqual({ nome: "Maria", telefone: "44988887777" });
    expect(disponiveis(await frango())).toBe(antes - 2);
    expect((await a.clientes.buscarPorTelefone("44988887777"))?.pedidosAnteriores).toBe(6);
  });

  it("avisa antes de enviar quando a tela já mostra que não cabe", async () => {
    const { a, criar } = montar();
    const { estoques } = await a.dias.obterPainel(DIA);
    await expect(
      criar.executar({ diaId: DIA, cliente: { nome: "Ana" }, itens: [{ produtoId: "pernil", quantidade: 1 }] }, estoques),
    ).rejects.toBeInstanceOf(QuantidadeIndisponivel);
  });

  it("a fonte da verdade também recusa, mesmo com números da tela desatualizados", async () => {
    const { a, criar } = montar();
    const telaAntiga = (await a.dias.obterPainel(DIA)).estoques;
    await criar.executar({ diaId: DIA, cliente: { nome: "Primeiro" }, itens: [{ produtoId: "costela", quantidade: 14 }] });
    await expect(
      criar.executar({ diaId: DIA, cliente: { nome: "Segundo" }, itens: [{ produtoId: "costela", quantidade: 1 }] }, telaAntiga),
    ).rejects.toMatchObject({ codigo: "quantidade-indisponivel", maximo: 0 });
  });

  it("exige nome e pelo menos um item", async () => {
    const { criar } = montar();
    await expect(criar.executar({ diaId: DIA, cliente: { nome: "" }, itens: [{ produtoId: "frango", quantidade: 1 }] })).rejects.toThrow("nome");
    await expect(criar.executar({ diaId: DIA, cliente: { nome: "Ana" }, itens: [] })).rejects.toThrow("pelo menos um");
  });
});

describe("CancelarPedido", () => {
  it("libera as unidades, avisa a lista de espera e emite o evento", async () => {
    const { a, cancelar } = montar();
    const eventos: EventoDoDia[] = [];
    a.eventos.assinar(DIA, (e) => eventos.push(e));
    const resultado = await cancelar.executar("p259"); // 9 pernis + 4 maioneses
    expect(resultado).toEqual({ unidadesLiberadas: 13, clientesAguardando: 2 });
    const pernil = (await a.dias.obterPainel(DIA)).estoques.find((e) => e.produtoId === "pernil")!;
    expect(disponiveis(pernil)).toBe(9);
    expect(eventos).toContainEqual({ tipo: "unidades-liberadas", produtoId: "pernil", quantidade: 9 });
  });
});

describe("dia encerrado", () => {
  it("não aceita pedidos", async () => {
    const { a, criar } = montar();
    await a.dias.fechar(DIA);
    await expect(criar.executar({ diaId: DIA, cliente: { nome: "Ana" }, itens: [{ produtoId: "frango", quantidade: 1 }] })).rejects.toMatchObject({ codigo: "dia-encerrado" });
  });
});
