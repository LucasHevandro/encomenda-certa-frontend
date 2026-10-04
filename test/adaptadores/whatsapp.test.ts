import { describe, expect, it } from "vitest";
import { linkWhatsApp, MensageiroWhatsApp, montarConfirmacao } from "@/adapters/saida/whatsapp/MensageiroWhatsApp";
import { centavos } from "@/core/domain/compartilhado/Dinheiro";
import type { Pedido } from "@/core/domain/pedido/Pedido";

const pedido: Pedido = {
  id: "p1",
  numero: 258,
  diaId: "2026-10-04",
  cliente: { nome: "João", telefone: "44999999999" },
  itens: [{ produtoId: "frango", nome: "Frango assado", quantidade: 2, precoUnitario: centavos(5500) }],
  retirada: "reservado",
  pagamento: "pendente",
};
const dia = { id: "2026-10-04", data: "2026-10-04", status: "aberto" as const };

describe("MensageiroWhatsApp", () => {
  it("monta nome, número, itens, valor e data", () => {
    const texto = montarConfirmacao(pedido, dia);
    expect(texto).toContain("João");
    expect(texto).toContain("#0258");
    expect(texto).toContain("2x Frango assado");
    expect(texto).toContain("R$ 110,00");
    expect(texto).toContain("domingo, 04/10");
  });

  it("abre wa.me com DDI 55", () => {
    expect(linkWhatsApp("oi", "(44) 99999-9999")).toBe("https://wa.me/5544999999999?text=oi");
    expect(linkWhatsApp("oi")).toBe("https://wa.me/?text=oi");
  });

  it("chama quem abre o link", () => {
    const abertos: string[] = [];
    new MensageiroWhatsApp((url) => abertos.push(url)).enviarConfirmacao(pedido, dia);
    expect(abertos[0]).toMatch(/^https:\/\/wa\.me\/5544999999999\?text=/);
  });
});
