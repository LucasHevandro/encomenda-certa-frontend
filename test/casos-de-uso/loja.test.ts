import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { PaginaDaLoja } from "@/core/application/casos-de-uso/loja/PaginaDaLoja";

describe("PaginaDaLoja", () => {
  beforeEach(() => {
    // Antes do prazo do domingo 04/10 (sábado às 20h).
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-02T12:00:00-03:00"));
  });
  afterEach(() => vi.useRealTimers());

  const montar = () => {
    const saida = criarAdaptadoresEmMemoria();
    return { saida, pagina: new PaginaDaLoja(saida.loja) };
  };

  it("pede nome e WhatsApp com DDD antes de ir à loja", async () => {
    const { pagina } = montar();
    const reserva = { diaId: "2026-10-04", itens: [{ produtoId: "frango", quantidade: 1 }] };
    await expect(pagina.reservar("expresso-cafe", { ...reserva, cliente: { nome: " ", telefone: "44999990000" } })).rejects.toThrow("seu nome");
    await expect(pagina.reservar("expresso-cafe", { ...reserva, cliente: { nome: "Ana", telefone: "9999" } })).rejects.toThrow("WhatsApp com DDD");
  });

  it("reserva como pedido online e o link mostra o pedido sem o telefone", async () => {
    const { pagina, saida } = montar();
    const { codigo, numero } = await pagina.reservar("expresso-cafe", {
      diaId: "2026-10-04",
      cliente: { nome: "Ana", telefone: "(44) 99999-0000" },
      itens: [{ produtoId: "frango", quantidade: 2 }],
    });
    const pedido = saida.banco.pedidos.find((p) => p.numero === numero)!;
    expect(pedido).toMatchObject({ origem: "online", cliente: { nome: "Ana", telefone: "44999990000" } });

    const visto = await pagina.acompanhar(codigo);
    expect(visto).toMatchObject({ numero, cliente: "Ana", retirada: "reservado", podeCancelar: true });
    expect(JSON.stringify(visto)).not.toContain("44999990000");
    expect((await pagina.cancelar(codigo)).retirada).toBe("cancelado");
  });

  it("não vende além do disponível nem depois do prazo", async () => {
    const { pagina } = montar();
    const cliente = { nome: "Ana", telefone: "44999990000" };
    await expect(pagina.reservar("expresso-cafe", { diaId: "2026-10-04", cliente, itens: [{ produtoId: "pernil", quantidade: 1 }] })).rejects.toBeInstanceOf(
      QuantidadeIndisponivel,
    );
    vi.setSystemTime(new Date("2026-10-03T20:00:00-03:00"));
    await expect(pagina.reservar("expresso-cafe", { diaId: "2026-10-04", cliente, itens: [{ produtoId: "frango", quantidade: 1 }] })).rejects.toThrow(
      "já foram encerrados",
    );
  });
});
