import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import { validarNovoPedido } from "../../../domain/pedido/Pedido";
import type { ClienteDaLoja, LojaGateway, ReservaDaLoja } from "../../portas/LojaGateway";

/** Pela página o WhatsApp é obrigatório: é por ele que a loja confirma e avisa. */
export function conferirClienteDaLoja(cliente: ClienteDaLoja): ClienteDaLoja {
  const nome = cliente.nome.trim();
  if (nome === "") throw new ErroDeDominio("cliente-sem-nome", "Informe o seu nome.");
  const telefone = cliente.telefone.replace(/\D/g, "");
  if (telefone.length < 10 || telefone.length > 13) throw new ErroDeDominio("telefone-invalido", "Informe um WhatsApp com DDD.");
  return { nome, telefone };
}

/**
 * A página em que os próprios clientes reservam. Confere o básico antes de ir à API
 * (nome, WhatsApp, pelo menos um item); a API confere de novo, com a produção travada.
 */
export class PaginaDaLoja {
  constructor(private readonly loja: LojaGateway) {}

  obter(endereco: string) {
    return this.loja.obter(endereco);
  }

  async reservar(endereco: string, reserva: ReservaDaLoja) {
    const cliente = conferirClienteDaLoja(reserva.cliente);
    const itens = reserva.itens.filter((i) => i.quantidade > 0);
    validarNovoPedido(cliente, itens);
    return this.loja.reservar(endereco, { ...reserva, cliente, itens });
  }

  async entrarNaEspera(endereco: string, entrada: { diaId: string; produtoId: string; cliente: ClienteDaLoja; quantidade: number }) {
    return this.loja.entrarNaEspera(endereco, { ...entrada, cliente: conferirClienteDaLoja(entrada.cliente) });
  }

  acompanhar(codigo: string) {
    return this.loja.acompanhar(codigo);
  }

  cancelar(codigo: string) {
    return this.loja.cancelar(codigo);
  }
}
