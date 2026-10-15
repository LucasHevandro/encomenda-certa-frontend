import { describe, expect, it } from "vitest";
import { CONFIGURACAO_PADRAO, descreverDias, encerramentoDoDia, preencherMensagem, sugerirEndereco, validarConfiguracao } from "./Configuracao";

describe("Configuracao", () => {
  it("limpa e ordena o que veio da tela", () => {
    const c = validarConfiguracao({
      ...CONFIGURACAO_PADRAO,
      nomeEstabelecimento: "  Padaria Sol ",
      corPrincipal: "#1E5B94",
      diasDeVenda: [5, 1, 3, 1],
      formasDePagamento: ["cartao", "pix"],
      logoUrl: " ",
    });
    expect(c).toMatchObject({ nomeEstabelecimento: "Padaria Sol", corPrincipal: "#1e5b94", diasDeVenda: [1, 3, 5], formasDePagamento: ["pix", "cartao"] });
    expect(c.logoUrl).toBeUndefined();
  });

  it("recusa o que não faz sentido", () => {
    expect(() => validarConfiguracao({ ...CONFIGURACAO_PADRAO, corPrincipal: "vermelho" })).toThrow("#rrggbb");
    expect(() => validarConfiguracao({ ...CONFIGURACAO_PADRAO, diasDeVenda: [] })).toThrow("dia de venda");
    expect(() => validarConfiguracao({ ...CONFIGURACAO_PADRAO, formasDePagamento: [] })).toThrow("forma de pagamento");
    expect(() => validarConfiguracao({ ...CONFIGURACAO_PADRAO, logoUrl: "http://inseguro.com/logo.png" })).toThrow("https");
  });

  it("descreve os dias como no balcão", () => {
    expect(descreverDias([6, 0])).toBe("sábado ou domingo");
    expect(descreverDias([1, 2, 3, 4, 5])).toBe("segunda, terça, quarta, quinta ou sexta");
    expect(descreverDias([0])).toBe("domingo");
  });

  it("pedidos online: endereço obrigatório para ligar, só minúsculas, números e hífen", () => {
    const online = (p: object) => validarConfiguracao({ ...CONFIGURACAO_PADRAO, pedidosOnline: { ...CONFIGURACAO_PADRAO.pedidosOnline, ...p } });
    expect(online({ ativo: true, endereco: " Expresso-Cafe " }).pedidosOnline.endereco).toBe("expresso-cafe");
    expect(() => online({ ativo: true })).toThrow("endereço da página");
    expect(() => online({ endereco: "café bom" })).toThrow("letras minúsculas");
    expect(() => online({ encerramentoMinutos: 15 })).toThrow("até quando");
    expect(() => online({ maximoPorProduto: 100 })).toThrow("1 a 99");
  });

  it("sugere o endereço pelo nome e conta o prazo da meia-noite de Brasília", () => {
    expect(sugerirEndereco("Expresso Café & Cia.")).toBe("expresso-cafe-cia");
    expect(encerramentoDoDia("2026-10-18", -240).toISOString()).toBe("2026-10-17T23:00:00.000Z");
  });

  it("preenche a mensagem e tira a linha do endereço quando não há endereço", () => {
    const texto = preencherMensagem("Olá, {cliente}!\nRetirada: {data}\n{endereco}\n{desconhecido}", { cliente: "Ana", data: "domingo, 04/10" });
    expect(texto).toBe("Olá, Ana!\nRetirada: domingo, 04/10\n{desconhecido}");
  });
});
