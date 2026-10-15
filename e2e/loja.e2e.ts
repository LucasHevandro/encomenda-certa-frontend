import { expect, test } from "@playwright/test";

/**
 * Página pública da loja, no modo memória (sem API). Os dias de exemplo são 04/10 e 11/10,
 * com prazo na véspera às 20h: o relógio do navegador fica antes disso.
 */

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-02T12:00:00-03:00"));
});

test("cliente reserva pela página, acompanha pelo link e cancela", async ({ page }) => {
  await page.goto("/loja/expresso-cafe");
  await expect(page.getByRole("heading", { name: "Encomenda Certa" })).toBeVisible();
  await expect(page.getByText("Pedidos e cancelamentos até sábado, 03/10, às 20h.")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Domingo, 11/10" })).toBeVisible();

  // Pernil esgotou: dá para pedir aviso.
  await page.getByRole("button", { name: "Me avise se sobrar" }).click();
  const folha = page.getByRole("dialog");
  await folha.getByLabel("Nome").fill("Rita");
  await folha.getByLabel("WhatsApp").fill("(44) 91111-2222");
  await folha.getByRole("button", { name: "Entrar na lista de espera" }).click();
  await expect(page.getByText("Você está na lista de espera.")).toBeVisible();

  await page.getByRole("button", { name: "Aumentar Frango assado" }).click();
  await page.getByRole("button", { name: "Aumentar Frango assado" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  // Continuar só mostra os dados; a reserva sai no botão de confirmar.
  await expect(page.getByRole("button", { name: "Confirmar reserva" })).toBeVisible();
  await expect(page).toHaveURL(/\/loja\/expresso-cafe$/);
  await expect(page.getByLabel("Nome")).toHaveValue("Rita");
  await page.getByRole("button", { name: "Confirmar reserva" }).click();

  await expect(page.getByRole("heading", { name: "Reserva realizada!" })).toBeVisible();
  await expect(page.getByText("#0260")).toBeVisible();
  await expect(page.getByText("Dá para cancelar até sábado, 03/10, às 20h.")).toBeVisible();

  await page.getByRole("button", { name: "Cancelar pedido" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar pedido" }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancelar pedido" })).toHaveCount(0);
});

test("sem WhatsApp não reserva, e o máximo por pedido limita o +", async ({ page }) => {
  await page.goto("/loja/expresso-cafe");
  for (let i = 0; i < 11; i++) await page.getByRole("button", { name: "Aumentar Frango assado" }).click();
  await expect(page.getByText("Cada pedido leva até 10.")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nome").fill("Caio");
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByText("Informe um WhatsApp com DDD.")).toBeVisible();
});

test("depois do prazo a página não mostra o dia", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-10T21:00:00-03:00"));
  await page.goto("/loja/expresso-cafe");
  await expect(page.getByText("Nenhum dia aberto para encomendas agora.")).toBeVisible();
  await page.goto("/loja/nao-existe");
  await expect(page.getByText("Não encontramos esta loja.")).toBeVisible();
});

test("a equipe vê o selo e o filtro dos pedidos online", async ({ page }) => {
  await page.goto("/entrar?proximo=%2Fdias%2F2026-10-04%2Fpedidos");
  await page.getByLabel("E-mail").fill("balcao@expressocafe.com");
  await page.getByLabel("Senha").fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("radio", { name: /Online/ }).click();
  const cartao = page.getByRole("link", { name: /Lúcia Ramos/ });
  await expect(cartao.getByText("Online")).toBeVisible();
  await cartao.click();
  await expect(page.getByText("Pedido online")).toBeVisible();
  await expect(page.getByText(/Reservado pelo cliente, na página/)).toBeVisible();
});

test("configurações ligam a página e mostram o link", async ({ page }) => {
  await page.goto("/entrar?proximo=%2Fconfiguracoes");
  await page.getByLabel("E-mail").fill("balcao@expressocafe.com");
  await page.getByLabel("Senha").fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  const chave = page.getByRole("switch", { name: "Receber pedidos pela página" });
  await expect(chave).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("link", { name: "Abrir a página" })).toHaveAttribute("href", /\/loja\/expresso-cafe$/);
  await page.getByLabel("Endereço da página").fill("Café Bom");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByText("O endereço da página usa de 3 a 40 letras minúsculas, números e hífen.")).toBeVisible();
});
