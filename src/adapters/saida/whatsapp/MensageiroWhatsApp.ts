import type { Mensageiro } from "@/core/application/portas/Mensageiro";
import type { DiaVenda } from "@/core/domain/dia-venda/DiaVenda";
import { type Pedido, totalDoItem, totalDoPedido } from "@/core/domain/pedido/Pedido";

const reais = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100).replace(/ /g, " ");

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function quando(dia: DiaVenda): string {
  const [ano, mes, d] = dia.data.split("-").map(Number);
  const data = new Date(ano, mes - 1, d);
  return `${DIAS[data.getDay()]}, ${String(d).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;
}

/** Texto da confirmação. Emoji só aqui, nunca na interface. */
export function montarConfirmacao(pedido: Pedido, dia: DiaVenda): string {
  const itens = pedido.itens.map((i) => `• ${i.quantidade}x ${i.nome} — ${reais(totalDoItem(i))}`).join("\n");
  return [
    `Olá, ${pedido.cliente.nome}! 🍗`,
    `Sua reserva no Expresso café está confirmada.`,
    ``,
    `*Pedido #${String(pedido.numero).padStart(4, "0")}*`,
    itens,
    ``,
    `*Total: ${reais(totalDoPedido(pedido))}*`,
    `Retirada: ${quando(dia)}`,
    ``,
    `Obrigado pela preferência!`,
  ].join("\n");
}

/** Link wa.me com o texto pronto. Sem telefone, o WhatsApp pergunta para quem enviar. */
export function linkWhatsApp(texto: string, telefone?: string): string {
  const digitos = telefone?.replace(/\D/g, "");
  const destino = digitos ? (digitos.startsWith("55") && digitos.length > 11 ? digitos : `55${digitos}`) : "";
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

/** Monta a mensagem e abre o WhatsApp; a pessoa confere e envia. Sem integração paga. */
export class MensageiroWhatsApp implements Mensageiro {
  constructor(private readonly abrir: (url: string) => void = (url) => window.open(url, "_blank", "noopener")) {}

  enviarConfirmacao(pedido: Pedido, dia: DiaVenda): void {
    this.abrir(linkWhatsApp(montarConfirmacao(pedido, dia), pedido.cliente.telefone));
  }
}
