import { describe, expect, it } from "vitest";
import {
  dataCurta,
  dataLonga,
  dinheiro,
  dinheiroCurto,
  numeroPedido,
  plural,
  quantidadeDe,
  telefone,
} from "@/adapters/entrada/ui/formatos";
import { centavos } from "@/core/domain/compartilhado/Dinheiro";

describe("formatos do balcão", () => {
  it("dinheiro com R$ e vírgula decimal", () => {
    expect(dinheiro(centavos(15700))).toBe("R$ 157,00");
    expect(dinheiro(centavos(19990))).toBe("R$ 199,90");
    expect(dinheiroCurto(centavos(234000))).toBe("R$ 2.340");
    expect(dinheiroCurto(centavos(19990))).toBe("R$ 199,90");
  });

  it("número do pedido com quatro dígitos", () => {
    expect(numeroPedido(258)).toBe("#0258");
    expect(numeroPedido(12345)).toBe("#12345");
  });

  it("datas como no caderno", () => {
    expect(dataCurta("2026-10-04")).toBe("Domingo, 04/10");
    expect(dataCurta("2026-10-03")).toBe("Sábado, 03/10");
    expect(dataLonga("2026-10-04")).toBe("04 de outubro");
  });

  it("quantidade com a palavra no singular ou no plural", () => {
    expect(quantidadeDe(1, "Frango assado")).toBe("1 Frango assado");
    expect(quantidadeDe(3, "Frango assado")).toBe("3 Frangos assados");
    expect(plural("Pernil")).toBe("Pernis");
    expect(plural("Costela")).toBe("Costelas");
  });

  it("telefone com DDD", () => {
    expect(telefone("44999999999")).toBe("(44) 99999-9999");
    expect(telefone(undefined)).toBe("");
  });
});
