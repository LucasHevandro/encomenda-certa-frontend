import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoProduto, Quantidade, Status } from "@/adapters/entrada/ui/componentes";

describe("componentes do design system", () => {
  it("Status mostra ícone e palavra", () => {
    const html = renderToStaticMarkup(<Status estado="reservado" />);
    expect(html).toContain("<svg");
    expect(html).toContain("Reservado");
  });

  it("CartaoProduto calcula disponíveis e o estado", () => {
    const html = renderToStaticMarkup(<CartaoProduto nome="Frango" producao={40} reservados={32} vendidos={5} />);
    expect(html).toContain(">3<");
    expect(html).toContain("Atenção");
    expect(html).toContain("93% da produção comprometida");
  });

  it("CartaoProduto esgotado", () => {
    const html = renderToStaticMarkup(<CartaoProduto nome="Pernil" producao={10} reservados={10} />);
    expect(html).toContain("nenhum disponível");
    expect(html).toContain("Esgotado");
  });

  it("Quantidade tem rótulos para leitor de tela", () => {
    const html = renderToStaticMarkup(<Quantidade valor={2} aoMudar={() => {}} rotulo="Frango" max={2} />);
    expect(html).toContain('aria-label="Aumentar Frango"');
    expect(html).toContain("border-dashed");
  });
});
