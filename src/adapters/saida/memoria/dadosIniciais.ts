import { centavos } from "@/core/domain/compartilhado/Dinheiro";
import { calcularFechamento } from "@/core/domain/fechamento/Fechamento";
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
    { id: "2026-09-20", data: "2026-09-20", status: "encerrado" },
    { id: "2026-09-13", data: "2026-09-13", status: "encerrado" },
  ];
  banco.producao.set("2026-10-04", new Map([["frango", 40], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.producao.set("2026-10-11", new Map([["frango", 40], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.producao.set("2026-09-27", new Map([["frango", 50], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.producao.set("2026-09-20", new Map([["frango", 45], ["costela", 15], ["pernil", 10], ["maionese", 20]]));
  banco.producao.set("2026-09-13", new Map([["frango", 40], ["costela", 12], ["pernil", 10], ["maionese", 15]]));

  banco.usuarios = [
    { id: "u1", nome: "Você", email: "voce@expressocafe.com", administrador: false },
    { id: "u2", nome: "Maria", email: "maria@expressocafe.com", administrador: false },
  ];
  banco.empresas = [{ id: "e1", nome: "Expresso café", ativa: true, criadaEm: "2026-09-01T12:00:00.000Z", usuarios: 2 }];

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

  // Domingos anteriores, já fechados: pedidos variados e o fechamento calculado a partir deles.
  const nomes = ["João da Silva", "Maria Oliveira", "Carlos Souza", "Pedro Alves", "Ana Lima", "Rita Melo"];
  const domingoFechado = (data: string, quantos: number, primeiroNumero: number) => {
    for (let i = 0; i < quantos; i++) {
      const itens = [item("frango", 1 + (i % 3)), ...(i % 2 ? [item("maionese", 1)] : []), ...(i % 4 === 0 ? [item("costela", 1)] : [])];
      if (i % 6 === 5) itens.push(item("pernil", 2));
      banco.pedidos.push(
        pedido(primeiroNumero + i, nomes[i % nomes.length], itens, {
          id: `a${primeiroNumero + i}`,
          diaId: data,
          retirada: i === quantos - 1 ? "reservado" : "retirado",
          pagamento: i === quantos - 1 ? "pendente" : i % 2 ? "pix" : "dinheiro",
        }),
      );
    }
    const fechamento = calcularFechamento(
      banco.estoques(data),
      banco.pedidos.filter((p) => p.diaId === data),
    );
    banco.fechamentos.set(data, { faturamento: fechamento.totalVendido, sobras: fechamento.sobras });
  };
  domingoFechado("2026-09-13", 18, 190);
  domingoFechado("2026-09-20", 21, 208);
  domingoFechado("2026-09-27", 24, 230);

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
