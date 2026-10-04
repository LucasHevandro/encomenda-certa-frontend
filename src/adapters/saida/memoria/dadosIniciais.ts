import { centavos } from "@/core/domain/compartilhado/Dinheiro";
import type { Pedido } from "@/core/domain/pedido/Pedido";
import { BancoEmMemoria } from "./BancoEmMemoria";

/** Dados parecidos com os das telas, para desenvolver sem a API. */
export function popularDadosIniciais(banco: BancoEmMemoria): void {
  banco.produtos = [
    { id: "frango", nome: "Frango assado", preco: centavos(5500), ativo: true },
    { id: "costela", nome: "Costela", preco: centavos(8990), ativo: true },
    { id: "pernil", nome: "Pernil", preco: centavos(6990), ativo: true },
    { id: "maionese", nome: "Maionese", preco: centavos(2500), ativo: true },
  ];

  banco.dias = [
    { id: "2026-10-04", data: "2026-10-04", status: "aberto" },
    { id: "2026-10-11", data: "2026-10-11", status: "aberto" },
    { id: "2026-09-27", data: "2026-09-27", status: "encerrado" },
  ];
  banco.producao.set("2026-10-04", new Map([["frango", 40], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.producao.set("2026-10-11", new Map([["frango", 40], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.producao.set("2026-09-27", new Map([["frango", 40], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.fechamentos.set("2026-09-27", { faturamento: centavos(351230), sobras: 4 });

  banco.clientes = [
    { id: "c1", nome: "João da Silva", telefone: "44999999999", pedidosAnteriores: 12 },
    { id: "c2", nome: "Maria Oliveira", telefone: "44988887777", pedidosAnteriores: 5 },
    { id: "c3", nome: "Carlos Souza", telefone: "44977776666", pedidosAnteriores: 2 },
    { id: "c4", nome: "Pedro Alves", telefone: "44966665555", pedidosAnteriores: 8 },
  ];

  const preco = (produtoId: string) => banco.produtos.find((p) => p.id === produtoId)!.preco;
  const item = (produtoId: string, quantidade: number) => ({
    produtoId,
    nome: banco.produtos.find((p) => p.id === produtoId)!.nome,
    quantidade,
    precoUnitario: preco(produtoId),
  });
  const pedido = (numero: number, cliente: string, itens: Pedido["itens"], extra: Partial<Pedido> = {}): Pedido => ({
    id: `p${numero}`,
    numero,
    diaId: "2026-10-04",
    cliente: { nome: cliente },
    itens,
    retirada: "reservado",
    pagamento: "pendente",
    ...extra,
  });

  banco.pedidos = [
    pedido(254, "Pedro Alves", [item("frango", 3)]),
    pedido(255, "Ana Lima", [item("costela", 1)], { retirada: "cancelado" }),
    pedido(256, "Carlos Souza", [item("frango", 2), item("pernil", 1)], { pagamento: "pix" }),
    pedido(257, "Maria Oliveira", [item("frango", 1)], { retirada: "retirado", pagamento: "dinheiro" }),
    pedido(258, "João da Silva", [item("frango", 2), item("costela", 1)]),
    pedido(259, "Lúcia Ramos", [item("pernil", 9), item("maionese", 4)]),
  ];
  banco.proximoNumero = 260;

  banco.espera = [
    { id: "e1", diaId: "2026-10-04", produtoId: "pernil", cliente: { nome: "Roberto" }, quantidade: 1, posicao: 1, status: "aguardando" },
    { id: "e2", diaId: "2026-10-04", produtoId: "pernil", cliente: { nome: "Sandra" }, quantidade: 2, posicao: 2, status: "aguardando" },
  ];

  banco.historicoProducao = [
    { produtoId: "frango", nome: "Frango assado", ultimo: 40, media: 38, sobraMedia: 2 },
    { produtoId: "costela", nome: "Costela", ultimo: 15, media: 14, sobraMedia: 1 },
    { produtoId: "pernil", nome: "Pernil", ultimo: 10, media: 9, sobraMedia: 1 },
    { produtoId: "maionese", nome: "Maionese", ultimo: 20, media: 18, sobraMedia: 3 },
  ];
}
