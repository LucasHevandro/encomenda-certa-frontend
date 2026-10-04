import { describe, expect, it } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { EditarPedido } from "@/core/application/casos-de-uso/pedidos/EditarPedido";
import { MarcarRetirado } from "@/core/application/casos-de-uso/pedidos/MarcarRetirado";
import { RegistrarPagamento } from "@/core/application/casos-de-uso/pedidos/RegistrarPagamento";
import { centavos } from "@/core/domain/compartilhado/Dinheiro";
import { disponiveis, QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";

const DIA = "2026-10-04";

describe("EditarPedido", () => {
  it("conta as unidades do próprio pedido como disponíveis", async () => {
    const a = criarAdaptadoresEmMemoria();
    const editar = new EditarPedido(a.pedidos);
    const pedido = await a.pedidos.obter("p254"); // 3 frangos; restam 32 frangos no dia
    const { estoques } = await a.dias.obterPainel(DIA);
    const salvo = await editar.executar(pedido, [{ produtoId: "frango", quantidade: 35 }], estoques);
    expect(salvo.itens).toEqual([expect.objectContaining({ produtoId: "frango", quantidade: 35 })]);
    await expect(editar.executar(salvo, [{ produtoId: "frango", quantidade: 36 }], (await a.dias.obterPainel(DIA)).estoques)).rejects.toMatchObject({
      maximo: 35,
    });
    await expect(editar.executar(salvo, [{ produtoId: "pernil", quantidade: 1 }])).rejects.toBeInstanceOf(QuantidadeIndisponivel);
  });

  it("mantém o preço da época para quem já estava no pedido", async () => {
    const a = criarAdaptadoresEmMemoria();
    await a.produtos.atualizar("frango", { preco: centavos(9900) });
    const pedido = await a.pedidos.obter("p254"); // 3 frangos a R$ 55
    const salvo = await new EditarPedido(a.pedidos).executar(pedido, [
      { produtoId: "frango", quantidade: 4 },
      { produtoId: "maionese", quantidade: 1 },
    ]);
    expect(salvo.itens.find((i) => i.produtoId === "frango")?.precoUnitario).toBe(5500);
  });
});

describe("retirada e pagamento", () => {
  it("retirar move de reservado para vendido sem mudar o disponível", async () => {
    const a = criarAdaptadoresEmMemoria();
    const frango = async () => (await a.dias.obterPainel(DIA)).estoques.find((e) => e.produtoId === "frango")!;
    const antes = await frango();
    await new MarcarRetirado(a.pedidos).executar("p254");
    const depois = await frango();
    expect(depois.vendidos).toBe(antes.vendidos + 3);
    expect(disponiveis(depois)).toBe(disponiveis(antes));
    await expect(new MarcarRetirado(a.pedidos).executar("p254")).rejects.toMatchObject({ codigo: "pedido-fechado" });
  });

  it("pagamento é independente da retirada", async () => {
    const a = criarAdaptadoresEmMemoria();
    const pago = await new RegistrarPagamento(a.pedidos).executar("p254", "pix");
    expect(pago).toMatchObject({ retirada: "reservado", pagamento: "pix" });
  });
});
