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

test("nenhuma tela passa da largura do celular", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "só no celular");
  await entrar(page, "/dias");
  const telas = [`/dias/${DIA}`, `/dias/${DIA}/pedidos`, `/dias/${DIA}/pedidos/novo`, `/dias/${DIA}/producao`, `/dias/${DIA}/espera`, `/dias/${DIA}/fechamento`, "/dias", "/produtos", "/clientes", "/pessoas"];
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
