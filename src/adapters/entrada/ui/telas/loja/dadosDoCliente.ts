/** Nome e WhatsApp do cliente ficam só neste aparelho, para o próximo pedido já vir preenchido. */

const CHAVE = "encomenda-certa:cliente";

export function lerCliente(): { nome: string; telefone: string } {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "{}") as { nome?: unknown; telefone?: unknown };
    return { nome: typeof salvo.nome === "string" ? salvo.nome : "", telefone: typeof salvo.telefone === "string" ? salvo.telefone : "" };
  } catch {
    return { nome: "", telefone: "" };
  }
}

export function lembrarCliente(nome: string, telefone: string) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ nome, telefone }));
  } catch {
    // Navegação privada ou armazenamento cheio: só não lembra.
  }
}
