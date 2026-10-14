import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destinoSeguro";

describe("destinoSeguro", () => {
  it("volta para caminhos do próprio app", () => {
    expect(destinoSeguro("/dias/2026-10-04/pedidos?filtro=reservados")).toBe("/dias/2026-10-04/pedidos?filtro=reservados");
  });

  it("sem destino vai para os dias de venda", () => {
    expect(destinoSeguro(undefined)).toBe("/dias");
    expect(destinoSeguro("")).toBe("/dias");
  });

  it.each(["https://site.com", "//site.com", "/\\site.com", "/\t/site.com", "/\\/site.com", "javascript:alert(1)"])(
    "não sai do app com %j",
    (proximo) => {
      expect(destinoSeguro(proximo)).toBe("/dias");
    },
  );
});
