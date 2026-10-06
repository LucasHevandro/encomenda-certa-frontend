import { expect, type Page, test } from "@playwright/test";

/**
 * Um domingo pelo navegador, com os dados de exemplo (modo memória).
 * Os dados voltam ao início a cada carregamento completo da página, então cada teste
 * entra uma vez e depois só navega pelo app.
 */

const DIA = "2026-10-04";

async function entrar(page: Page, destino = `/dias/${DIA}`) {
  await page.goto(`/entrar?proximo=${encodeURIComponent(destino)}`);
  await page.getByLabel("E-mail").fill("balcao@expressocafe.com");
  await page.getByLabel("Senha").fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(`${destino}$`));
}

/** A barra de baixo no celular e a coluna lateral no computador têm os mesmos itens. */
const navegacao = (page: Page) => page.getByRole("navigation", { name: "Navegação principal" });

test("sem login, qualquer tela volta para o login", async ({ page }) => {
  await page.goto(`/dias/${DIA}/pedidos`);
  await expect(page).toHaveURL(/\/entrar\?proximo=/);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("reservar, mandar para o WhatsApp, retirar e pagar", async ({ page }) => {
  await entrar(page);
  await expect(page.getByText("itens disponíveis")).toBeVisible();

  await navegacao(page).getByRole("link", { name: "Novo pedido" }).click();
  await page.getByLabel("Telefone").fill("(44) 99999-9999");
  // O cliente conhecido aparece pelo telefone e preenche o nome.
  await page.getByRole("button", { name: /João da Silva/ }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("João da Silva");
  await page.getByRole("button", { name: "Aumentar Frango assado" }).click();
  await page.getByRole("button", { name: "Aumentar Frango assado" }).click();
  await expect(page.getByText("R$ 110,00").first()).toBeVisible();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();

  await expect(page.getByRole("heading", { name: "Reserva realizada!" })).toBeVisible();
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Enviar confirmação pelo WhatsApp" }).click();
  expect((await popup).url()).toContain("5544999999999");

  await page.getByRole("link", { name: "Ver pedido" }).click();
  await expect(page.getByText("Reservado", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Pix" }).click();
  await expect(page.getByText("Pago", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Marcar como retirado" }).click();
  const confirmacao = page.getByRole("dialog");
  await expect(confirmacao).toContainText("Confirmar retirada do pedido #0260?");
  await confirmacao.getByRole("button", { name: "Confirmar retirada" }).click();
  await expect(page.getByText("Retirado", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Marcar como retirado" })).toHaveCount(0);
});

test("produto esgotado: avisa e coloca o cliente na lista de espera", async ({ page }) => {
  await entrar(page, `/dias/${DIA}/pedidos/novo`);
  await page.getByLabel("Nome").fill("Bruno");
  await page.getByRole("button", { name: "Aumentar Pernil" }).click();

  const aviso = page.getByRole("alert").filter({ hasText: "Pernil esgotado" });
  await expect(aviso).toBeVisible();
  await aviso.getByRole("button", { name: "Lista de espera" }).click();
  await expect(page.getByText("Bruno entrou na lista de espera: 1 pernil, 3º da fila.")).toBeVisible();
});

test("cancelar libera as unidades e reativar devolve a reserva", async ({ page }) => {
  await entrar(page, `/dias/${DIA}/pedidos`);
  await page.getByRole("link", { name: /#0259/ }).click();

  await page.getByRole("button", { name: "Cancelar reserva" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar reserva" }).click();
  // Aviso de unidades liberadas, com a lista de espera do pernil.
  await expect(page.getByText("13 unidades foram liberadas")).toBeVisible();
  await expect(page.getByText("Existem clientes aguardando Pernil.")).toBeVisible();
  await expect(page.getByText(/Cancelado por Você/)).toBeVisible();

  await page.getByRole("button", { name: "Reativar reserva" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reativar reserva" }).click();
  await expect(page.getByText("Reservado", { exact: true })).toBeVisible();
  await expect(page.getByText(/Cancelado por/)).toHaveCount(0);
});

test("produção não fica abaixo do reservado", async ({ page }) => {
  await entrar(page, `/dias/${DIA}/producao`);
  await page.getByRole("button", { name: "Diminuir Produção de Pernil" }).click();
  await expect(page.getByText("Produção menor que as reservas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar produção" })).toBeDisabled();

  await page.getByRole("button", { name: "Ajustar para 10" }).click();
  await page.getByRole("button", { name: "Aumentar Produção de Frango assado" }).click();
  await page.getByRole("button", { name: "Salvar produção" }).click();
  await expect(page.getByText("Produção salva")).toBeVisible();
  await expect(page.getByText("Frango assado: de 40 para 41")).toBeVisible();
});

test("fechar o domingo deixa o dia só para consulta", async ({ page }) => {
  await entrar(page, `/dias/${DIA}/fechamento`);
  await expect(page.getByText("Existem 4 pedidos ainda marcados como Reservado.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Fechar o domingo" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Fechar o domingo" }).click();
  await expect(page.getByText("Dia fechado")).toBeVisible();

  await navegacao(page).getByRole("link", { name: "Produção" }).click();
  await expect(page.getByText("Este dia já foi fechado")).toBeVisible();
  await expect(page.getByRole("button", { name: /Produção de/ })).toHaveCount(0);
});

test("histórico do cliente: quanto já comprou e o que costuma pedir", async ({ page }) => {
  await entrar(page, "/clientes");
  await page.getByRole("link", { name: /João da Silva/ }).click();
  await expect(page.getByRole("heading", { name: "João da Silva" })).toBeVisible();
  await expect(page.getByText("já comprou")).toBeVisible();
  await expect(page.getByText("2 Frangos assados").first()).toBeVisible();
  await page.getByRole("link", { name: /#0258/ }).click();
  await expect(page).toHaveURL(/\/pedidos\/p258$/);
});

test("relatório entre dias mostra o aproveitamento de cada produto", async ({ page }) => {
  await entrar(page, "/dias");
  await page.getByRole("link", { name: "Relatório entre dias" }).click();
  await expect(page.getByRole("heading", { name: "Relatório" })).toBeVisible();
  await expect(page.getByText("vendidos em 3 dias")).toBeVisible();
  const frango = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Frango assado" }) });
  await expect(frango.getByText("da produção vendida")).toBeVisible();
  await frango.getByText("Dia a dia").click();
  await expect(frango.getByRole("cell", { name: "Domingo, 27/09" })).toBeVisible();
  await page.getByRole("radio", { name: "Últimos 4 dias" }).click();
  await expect(page.getByText("vendidos em 3 dias")).toBeVisible();
});

test("configurações mudam o nome, os dias de venda e a mensagem", async ({ page }) => {
  await entrar(page, "/dias");
  const gestao = page.getByRole("navigation", { name: "Gestão" });
  await gestao.getByRole("link", { name: /Ajustes|Configurações/ }).click();
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await page.getByLabel("Nome do estabelecimento").fill("Padaria Sol");
  await page.getByLabel("Endereço de retirada (opcional)").fill("Rua das Flores, 10");
  await expect(page.getByLabel("Prévia da mensagem")).toContainText("Padaria Sol");
  await expect(page.getByLabel("Prévia da mensagem")).toContainText("Rua das Flores, 10");
  // Só sábado: o domingo deixa de ser dia de venda.
  await page.getByRole("button", { name: "domingo" }).click();
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByText("Configurações salvas")).toBeVisible();
  await expect(gestao.getByText("Padaria Sol")).toBeVisible();

  await gestao.getByRole("link", { name: /^Dias/ }).click();
  await page.getByRole("link", { name: "Abrir novo dia" }).click();
  await expect(page.getByText("Dias de venda: sábado.")).toBeVisible();
});

test("administrador cria uma empresa com o primeiro acesso e desativa", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("admin@sistema.com");
  await page.getByLabel("Senha").fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Empresas" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Expresso café" })).toBeVisible();

  await page.getByLabel("Nome do estabelecimento").fill("Padaria Sol");
  await page.getByLabel("Nome da pessoa").fill("Bia");
  await page.getByLabel("E-mail").fill("bia@sol.com");
  await page.getByLabel("Senha inicial").fill("senha-da-bia");
  await page.getByRole("button", { name: "Criar empresa" }).click();
  await expect(page.getByText("Bia já pode entrar em Padaria Sol com bia@sol.com")).toBeVisible();

  const sol = page.getByRole("listitem").filter({ hasText: "Padaria Sol" });
  await expect(sol.getByText("Ativa", { exact: true })).toBeVisible();
  await sol.getByRole("button", { name: "Desativar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Desativar" }).click();
  await expect(sol.getByText("Desativada", { exact: true })).toBeVisible();
  await sol.getByRole("button", { name: "Reativar" }).click();
  await expect(sol.getByText("Ativa", { exact: true })).toBeVisible();
});

test("tema escuro escolhido no aparelho fica guardado", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Tema claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("nenhuma tela passa da largura do celular", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "só no celular");
  await entrar(page, "/dias");
  const telas = [`/dias/${DIA}`, `/dias/${DIA}/pedidos`, `/dias/${DIA}/pedidos/novo`, `/dias/${DIA}/producao`, `/dias/${DIA}/espera`, `/dias/${DIA}/fechamento`, "/dias", "/dias/relatorio", "/produtos", "/clientes", "/clientes/c1", "/pessoas", "/configuracoes", "/admin"];
  for (const tela of telas) {
    // O cookie de sessão continua depois do login, então dá para abrir cada tela direto.
    await page.goto(tela);
    await expect(page).toHaveURL(new RegExp(`${tela}$`));
    // Espera os dados chegarem (os esqueletos de carregamento somem).
    await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra, `${tela} passou da largura`).toBe(0);
  }
});
