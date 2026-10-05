import { describe, expect, it } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { GerenciarUsuarios } from "@/core/application/casos-de-uso/auth/GerenciarUsuarios";
import { ReativarPedido } from "@/core/application/casos-de-uso/pedidos/ReativarPedido";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";

const DIA = "2026-10-04";

describe("ReativarPedido", () => {
  it("volta um cancelado para reservado e apaga o registro do cancelamento", async () => {
    const a = criarAdaptadoresEmMemoria();
    await a.pedidos.cancelar("p258");
    const cancelado = await a.pedidos.obter("p258");
    expect(cancelado.registro?.canceladoPor).toBe("Você");
    const reativado = await new ReativarPedido(a.pedidos).executar(cancelado, (await a.dias.obterPainel(DIA)).estoques);
    expect(reativado.retirada).toBe("reservado");
    expect(reativado.registro?.canceladoPor).toBeUndefined();
  });

  it("recusa quando as unidades já foram para outro pedido", async () => {
    const a = criarAdaptadoresEmMemoria();
    await a.pedidos.cancelar("p259"); // 9 pernis liberados
    await a.pedidos.criar({ diaId: DIA, cliente: { nome: "Bia" }, itens: [{ produtoId: "pernil", quantidade: 9 }] });
    const cancelado = await a.pedidos.obter("p259");
    const caso = new ReativarPedido(a.pedidos);
    await expect(caso.executar(cancelado, (await a.dias.obterPainel(DIA)).estoques)).rejects.toBeInstanceOf(QuantidadeIndisponivel);
    await expect(caso.executar(cancelado)).rejects.toMatchObject({ codigo: "quantidade-indisponivel", maximo: 0 });
  });

  it("só reativa pedido cancelado", async () => {
    const a = criarAdaptadoresEmMemoria();
    const reservado = await a.pedidos.obter("p258");
    await expect(new ReativarPedido(a.pedidos).executar(reservado)).rejects.toThrow("cancelado");
  });
});

describe("GerenciarUsuarios", () => {
  it("valida antes de criar e recusa e-mail repetido", async () => {
    const caso = new GerenciarUsuarios(criarAdaptadoresEmMemoria().usuarios);
    expect(() => caso.criar({ nome: "", email: "a@b.com", senha: "12345678" })).toThrow("nome");
    expect(() => caso.criar({ nome: "Ana", email: "ana", senha: "12345678" })).toThrow("e-mail");
    expect(() => caso.criar({ nome: "Ana", email: "ana@b.com", senha: "123" })).toThrow("8 caracteres");
    const ana = await caso.criar({ nome: " Ana ", email: "Ana@B.com", senha: "12345678" });
    expect(ana).toMatchObject({ nome: "Ana", email: "ana@b.com" });
    await expect(caso.criar({ nome: "Outra", email: "ana@b.com", senha: "12345678" })).rejects.toMatchObject({ codigo: "email-ja-existe" });
  });

  it("confere a confirmação da nova senha", () => {
    const caso = new GerenciarUsuarios(criarAdaptadoresEmMemoria().usuarios);
    expect(() => caso.mudarSenha("atual", "nova-senha-1", "nova-senha-2")).toThrow("confirmação");
  });
});
