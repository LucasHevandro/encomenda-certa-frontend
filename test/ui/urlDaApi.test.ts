import { describe, expect, it } from "vitest";
import { urlDaApi } from "@/config/container";

describe("urlDaApi", () => {
  it("no computador, usa o endereço configurado", () => {
    expect(urlDaApi("http://localhost:3333/", "localhost")).toBe("http://localhost:3333");
  });

  it("no celular pela rede, troca localhost pelo IP da página", () => {
    expect(urlDaApi("http://localhost:3333", "192.168.0.10")).toBe("http://192.168.0.10:3333");
  });

  it("endereço de produção não muda", () => {
    expect(urlDaApi("https://api.expressocafe.com", "app.expressocafe.com")).toBe("https://api.expressocafe.com");
  });
});
