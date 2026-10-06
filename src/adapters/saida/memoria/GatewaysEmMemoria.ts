import type { ClientesGateway, ClienteEncontrado } from "@/core/application/portas/ClientesGateway";
import type { PedidoDoHistorico } from "@/core/domain/cliente/Historico";
import type { AbrirDia, DiasGateway, PainelDoDia, ResumoDia, SugestaoProducao } from "@/core/application/portas/DiasGateway";
import type { EsperaGateway } from "@/core/application/portas/EsperaGateway";
import type { EventosTempoReal, EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import type { Mensageiro } from "@/core/application/portas/Mensageiro";
import type { FiltroPedidos, NovoPedido, PedidosGateway, ResultadoCancelamento } from "@/core/application/portas/PedidosGateway";
import type { AlteracaoProducao, ProducaoGateway } from "@/core/application/portas/ProducaoGateway";
import type { ProdutosGateway } from "@/core/application/portas/ProdutosGateway";
import type { SessaoGateway, Usuario } from "@/core/application/portas/SessaoGateway";
import type { ConfiguracaoGateway } from "@/core/application/portas/ConfiguracaoGateway";
import type { Configuracao } from "@/core/domain/configuracao/Configuracao";
import type { NovoUsuario, UsuariosGateway } from "@/core/application/portas/UsuariosGateway";
import { centavos, type Dinheiro, somar } from "@/core/domain/compartilhado/Dinheiro";
import { ErroDeDominio } from "@/core/domain/compartilhado/ErroDeDominio";
import { type DiaVenda, estaAberto as diaAberto, validarNovaData } from "@/core/domain/dia-venda/DiaVenda";
import { disponiveis, type ItemSolicitado, verificarItens } from "@/core/domain/disponibilidade/Disponibilidade";
import type { EntradaEspera } from "@/core/domain/lista-espera/EntradaEspera";
import { estaAberto, type ItemPedido, type Pagamento, type Pedido, totalDoPedido } from "@/core/domain/pedido/Pedido";
import { calcularFechamento, type DiaFechado } from "@/core/domain/fechamento/Fechamento";
import { validarNovaProducao } from "@/core/domain/producao/Producao";
import type { Produto } from "@/core/domain/produto/Produto";
import type { BancoEmMemoria } from "./BancoEmMemoria";

/** Quem aparece no registro dos pedidos feitos sem a API. */
const QUEM = "Você";

const naoEncontrado = (o_que: string) => new ErroDeDominio("nao-encontrado", `${o_que} não encontrado.`);

function diaParaEscrita(banco: BancoEmMemoria, diaId: string): DiaVenda {
  const dia = banco.dias.find((d) => d.id === diaId);
  if (!dia) throw naoEncontrado("Dia de venda");
  if (!diaAberto(dia)) throw new ErroDeDominio("dia-encerrado", "Este dia já foi fechado e não recebe mais alterações.");
  return dia;
}

export class DiasEmMemoria implements DiasGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async listar(): Promise<ResumoDia[]> {
    await this.banco.esperar();
    return this.banco.dias
      .map((dia) => {
        const pedidos = this.banco.pedidos.filter((p) => p.diaId === dia.id && p.retirada !== "cancelado").length;
        const itensDisponiveis = this.banco.estoques(dia.id).reduce((total, e) => total + disponiveis(e), 0);
        const fechamento = this.banco.fechamentos.get(dia.id);
        return { dia, pedidos, itensDisponiveis, faturamento: fechamento?.faturamento, sobras: fechamento?.sobras };
      })
      .sort((a, b) => a.dia.data.localeCompare(b.dia.data));
  }

  async obterPainel(diaId: string): Promise<PainelDoDia> {
    await this.banco.esperar();
    const dia = this.banco.dias.find((d) => d.id === diaId);
    if (!dia) throw naoEncontrado("Dia de venda");
    const pedidos = this.banco.pedidos.filter((p) => p.diaId === diaId && p.retirada !== "cancelado");
    const reservados = pedidos.filter((p) => p.retirada === "reservado").sort((a, b) => a.numero - b.numero);
    const clientesAguardando: Record<string, number> = {};
    for (const entrada of this.banco.espera) {
      if (entrada.diaId === diaId && entrada.status === "aguardando") {
        clientesAguardando[entrada.produtoId] = (clientesAguardando[entrada.produtoId] ?? 0) + 1;
      }
    }
    return {
      dia,
      estoques: this.banco.estoques(diaId),
      pedidos: pedidos.length,
      itensReservados: reservados.flatMap((p) => p.itens).reduce((total, i) => total + i.quantidade, 0),
      valorReservado: somar(...reservados.map(totalDoPedido)),
      aguardandoRetirada: reservados.length,
      proximoARetirar: reservados[0] && { numero: reservados[0].numero, cliente: reservados[0].cliente.nome },
      clientesAguardando,
    };
  }

  async sugestaoProducao(): Promise<SugestaoProducao[]> {
    await this.banco.esperar();
    return [...this.banco.historicoProducao];
  }

  async relatorio(dias: number): Promise<DiaFechado[]> {
    await this.banco.esperar();
    return this.banco.dias
      .filter((d) => d.status === "encerrado")
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, dias)
      .map((dia) => ({
        diaId: dia.id,
        data: dia.data,
        faturamento: this.banco.fechamentos.get(dia.id)?.faturamento ?? centavos(0),
        produtos: calcularFechamento(
          this.banco.estoques(dia.id),
          this.banco.pedidos.filter((p) => p.diaId === dia.id),
        ).produtos,
      }));
  }

  async abrir(comando: AbrirDia): Promise<DiaVenda> {
    await this.banco.esperar();
    validarNovaData(
      comando.data,
      this.banco.dias.map((d) => d.data),
      this.banco.configuracao.diasDeVenda,
    );
    const dia: DiaVenda = { id: comando.data, data: comando.data, status: "aberto" };
    this.banco.dias.push(dia);
    this.banco.producao.set(dia.id, new Map(comando.producao.map((p) => [p.produtoId, p.quantidade])));
    return dia;
  }

  async fechar(diaId: string): Promise<void> {
    await this.banco.esperar();
    const dia = diaParaEscrita(this.banco, diaId);
    const naoCancelados = this.banco.pedidos.filter((p) => p.diaId === diaId && p.retirada !== "cancelado");
    // Decisão do negócio: pedido não retirado também conta no total vendido.
    const faturamento = somar(...naoCancelados.map(totalDoPedido));
    const sobras = this.banco.estoques(diaId).reduce((total, e) => total + disponiveis(e), 0);
    this.banco.fechamentos.set(diaId, { faturamento, sobras });
    this.banco.dias = this.banco.dias.map((d) => (d.id === dia.id ? { ...d, status: "encerrado" } : d));
  }
}

export class PedidosEmMemoria implements PedidosGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async listar(diaId: string, filtro: FiltroPedidos = {}): Promise<Pedido[]> {
    await this.banco.esperar();
    const busca = filtro.busca?.trim().toLowerCase();
    return this.banco.pedidos
      .filter((p) => p.diaId === diaId)
      .filter((p) => !filtro.retirada || p.retirada === filtro.retirada)
      .filter(
        (p) =>
          !busca ||
          p.cliente.nome.toLowerCase().includes(busca) ||
          (p.cliente.telefone ?? "").includes(busca) ||
          String(p.numero).includes(busca.replace("#", "")),
      )
      .sort((a, b) => b.numero - a.numero);
  }

  async obter(pedidoId: string): Promise<Pedido> {
    await this.banco.esperar();
    return this.buscar(pedidoId);
  }

  async criar(novo: NovoPedido): Promise<Pedido> {
    await this.banco.esperar();
    diaParaEscrita(this.banco, novo.diaId);
    // Na API real esta checagem acontece dentro da transação, com a produção travada.
    verificarItens(this.banco.estoques(novo.diaId), novo.itens);
    const pedido: Pedido = {
      id: crypto.randomUUID(),
      numero: this.banco.proximoNumero++,
      diaId: novo.diaId,
      cliente: { ...novo.cliente },
      itens: this.montarItens(novo.itens),
      retirada: "reservado",
      pagamento: "pendente",
      registro: { reservadoPor: QUEM, reservadoEm: new Date().toISOString() },
    };
    this.banco.pedidos.push(pedido);
    this.lembrarCliente(pedido);
    this.banco.emitir(novo.diaId, { tipo: "disponibilidade-mudou" });
    return pedido;
  }

  async editarItens(pedidoId: string, itens: readonly ItemSolicitado[]): Promise<Pedido> {
    await this.banco.esperar();
    const atual = this.buscarAberto(pedidoId);
    diaParaEscrita(this.banco, atual.diaId);
    // As unidades do próprio pedido voltam para a conta antes de conferir.
    const estoques = this.banco.estoques(atual.diaId).map((e) => ({
      ...e,
      reservados: e.reservados - atual.itens.filter((i) => i.produtoId === e.produtoId).reduce((t, i) => t + i.quantidade, 0),
    }));
    verificarItens(estoques, itens);
    // Quem já estava no pedido mantém o preço da época.
    const novos = this.montarItens(itens).map((item) => {
      const antigo = atual.itens.find((i) => i.produtoId === item.produtoId);
      return antigo ? { ...item, precoUnitario: antigo.precoUnitario } : item;
    });
    return this.substituir({ ...atual, itens: novos });
  }

  async marcarRetirado(pedidoId: string): Promise<Pedido> {
    await this.banco.esperar();
    const atual = this.buscarAberto(pedidoId);
    diaParaEscrita(this.banco, atual.diaId);
    return this.substituir({ ...atual, retirada: "retirado", registro: { ...atual.registro, retiradoPor: QUEM, retiradoEm: new Date().toISOString() } });
  }

  async registrarPagamento(pedidoId: string, pagamento: Pagamento): Promise<Pedido> {
    await this.banco.esperar();
    const atual = this.buscar(pedidoId);
    if (pagamento !== "pendente" && !this.banco.configuracao.formasDePagamento.includes(pagamento)) {
      throw new ErroDeDominio("pagamento-nao-aceito", "Esta forma de pagamento não está ativa nas configurações.");
    }
    return this.substituir({ ...atual, pagamento });
  }

  async cancelar(pedidoId: string): Promise<ResultadoCancelamento> {
    await this.banco.esperar();
    const atual = this.buscarAberto(pedidoId);
    diaParaEscrita(this.banco, atual.diaId);
    this.substituir({ ...atual, retirada: "cancelado", registro: { ...atual.registro, canceladoPor: QUEM, canceladoEm: new Date().toISOString() } });
    const produtos = new Set(atual.itens.map((i) => i.produtoId));
    const clientesAguardando = this.banco.espera.filter(
      (e) => e.diaId === atual.diaId && e.status === "aguardando" && produtos.has(e.produtoId),
    ).length;
    for (const item of atual.itens) {
      this.banco.emitir(atual.diaId, { tipo: "unidades-liberadas", produtoId: item.produtoId, quantidade: item.quantidade });
    }
    return { unidadesLiberadas: atual.itens.reduce((t, i) => t + i.quantidade, 0), clientesAguardando };
  }

  async reativar(pedidoId: string): Promise<Pedido> {
    await this.banco.esperar();
    const atual = this.buscar(pedidoId);
    if (atual.retirada !== "cancelado") throw new ErroDeDominio("pedido-nao-cancelado", "Só dá para reativar pedido cancelado.");
    diaParaEscrita(this.banco, atual.diaId);
    verificarItens(this.banco.estoques(atual.diaId), atual.itens);
    // Volta a reservado e o registro do cancelamento some.
    return this.substituir({ ...atual, retirada: "reservado", registro: { ...atual.registro, canceladoPor: undefined, canceladoEm: undefined } });
  }

  private buscar(pedidoId: string): Pedido {
    const pedido = this.banco.pedidos.find((p) => p.id === pedidoId);
    if (!pedido) throw naoEncontrado("Pedido");
    return pedido;
  }

  private buscarAberto(pedidoId: string): Pedido {
    const pedido = this.buscar(pedidoId);
    if (!estaAberto(pedido)) throw new ErroDeDominio("pedido-fechado", "Este pedido já foi retirado ou cancelado.");
    return pedido;
  }

  private substituir(pedido: Pedido): Pedido {
    this.banco.pedidos = this.banco.pedidos.map((p) => (p.id === pedido.id ? pedido : p));
    this.banco.emitir(pedido.diaId, { tipo: "disponibilidade-mudou" });
    return pedido;
  }

  private montarItens(itens: readonly ItemSolicitado[]): ItemPedido[] {
    return itens
      .filter((i) => i.quantidade > 0)
      .map((i) => {
        const produto = this.banco.produtos.find((p) => p.id === i.produtoId);
        if (!produto) throw naoEncontrado("Produto");
        return { produtoId: produto.id, nome: produto.nome, quantidade: i.quantidade, precoUnitario: produto.preco };
      });
  }

  private lembrarCliente(pedido: Pedido): void {
    const { nome, telefone } = pedido.cliente;
    const existente = telefone ? this.banco.clientes.find((c) => c.telefone === telefone) : undefined;
    if (existente) {
      this.banco.clientes = this.banco.clientes.map((c) =>
        c.id === existente.id ? { ...c, pedidosAnteriores: c.pedidosAnteriores + 1 } : c,
      );
    } else {
      this.banco.clientes.push({ id: crypto.randomUUID(), nome, telefone, pedidosAnteriores: 1 });
    }
  }
}

export class ProducaoEmMemoria implements ProducaoGateway {
  constructor(
    private readonly banco: BancoEmMemoria,
    private readonly usuario = "Você",
  ) {}

  async obter(diaId: string) {
    await this.banco.esperar();
    return this.banco.estoques(diaId);
  }

  async salvar(diaId: string, quantidades: readonly { produtoId: string; quantidade: number }[]): Promise<void> {
    await this.banco.esperar();
    diaParaEscrita(this.banco, diaId);
    const estoques = this.banco.estoques(diaId);
    // Confere tudo antes de gravar qualquer coisa, como numa transação.
    for (const { produtoId, quantidade } of quantidades) {
      const estoque = estoques.find((e) => e.produtoId === produtoId);
      if (estoque) {
        validarNovaProducao(estoque, quantidade);
      } else if (!this.banco.produtos.some((p) => p.id === produtoId)) {
        throw naoEncontrado("Produto");
      }
    }
    const doDia = this.banco.producao.get(diaId) ?? new Map<string, number>();
    this.banco.producao.set(diaId, doDia);
    for (const { produtoId, quantidade } of quantidades) {
      // Produto que ainda não estava no dia entra com produção zero.
      const de = doDia.get(produtoId) ?? 0;
      if (de === quantidade) continue;
      doDia.set(produtoId, quantidade);
      this.banco.alteracoes.push({ diaId, produtoId, de, para: quantidade, em: new Date().toISOString(), usuario: this.usuario });
    }
    this.banco.emitir(diaId, { tipo: "disponibilidade-mudou" });
  }

  async historico(diaId: string): Promise<AlteracaoProducao[]> {
    await this.banco.esperar();
    return this.banco.alteracoes.filter((a) => a.diaId === diaId);
  }
}

export class ClientesEmMemoria implements ClientesGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async buscarPorTelefone(telefone: string): Promise<ClienteEncontrado | null> {
    await this.banco.esperar();
    const digitos = telefone.replace(/\D/g, "");
    return this.banco.clientes.find((c) => c.telefone === digitos) ?? null;
  }

  async listar(): Promise<ClienteEncontrado[]> {
    await this.banco.esperar();
    return [...this.banco.clientes].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  /** Sem banco de verdade, o pedido é do cliente pelo telefone ou, sem telefone, pelo nome. */
  async historico(clienteId: string): Promise<{ cliente: ClienteEncontrado; pedidos: PedidoDoHistorico[] }> {
    await this.banco.esperar();
    const cliente = this.banco.clientes.find((c) => c.id === clienteId);
    if (!cliente) throw naoEncontrado("Cliente");
    const pedidos = this.banco.pedidos
      .filter((p) => (p.cliente.telefone ? p.cliente.telefone === cliente.telefone : p.cliente.nome === cliente.nome))
      .map((p) => ({ ...p, data: this.banco.dias.find((d) => d.id === p.diaId)?.data ?? p.diaId }))
      .sort((a, b) => b.data.localeCompare(a.data) || b.numero - a.numero);
    return { cliente, pedidos };
  }
}

export class ProdutosEmMemoria implements ProdutosGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async listar(): Promise<Produto[]> {
    await this.banco.esperar();
    return [...this.banco.produtos];
  }

  async criar({ nome, preco }: { nome: string; preco: Dinheiro }): Promise<Produto> {
    await this.banco.esperar();
    const produto: Produto = { id: crypto.randomUUID(), nome, preco, ativo: true };
    this.banco.produtos.push(produto);
    return produto;
  }

  async atualizar(produtoId: string, mudancas: { preco?: Dinheiro; ativo?: boolean }): Promise<Produto> {
    await this.banco.esperar();
    const atual = this.banco.produtos.find((p) => p.id === produtoId);
    if (!atual) throw naoEncontrado("Produto");
    const novo = { ...atual, ...mudancas };
    this.banco.produtos = this.banco.produtos.map((p) => (p.id === produtoId ? novo : p));
    return novo;
  }
}

export class EsperaEmMemoria implements EsperaGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async listar(diaId: string): Promise<EntradaEspera[]> {
    await this.banco.esperar();
    return this.banco.espera.filter((e) => e.diaId === diaId).sort((a, b) => a.posicao - b.posicao);
  }

  async adicionar(entrada: Pick<EntradaEspera, "diaId" | "produtoId" | "cliente" | "quantidade">): Promise<EntradaEspera> {
    await this.banco.esperar();
    diaParaEscrita(this.banco, entrada.diaId);
    const naFila = this.banco.espera.filter((e) => e.diaId === entrada.diaId && e.produtoId === entrada.produtoId);
    const nova: EntradaEspera = { ...entrada, id: crypto.randomUUID(), posicao: naFila.length + 1, status: "aguardando" };
    this.banco.espera.push(nova);
    this.banco.emitir(entrada.diaId, { tipo: "disponibilidade-mudou" });
    return nova;
  }

  async mudarStatus(entradaId: string, status: EntradaEspera["status"]): Promise<EntradaEspera> {
    await this.banco.esperar();
    const atual = this.banco.espera.find((e) => e.id === entradaId);
    if (!atual) throw naoEncontrado("Cliente na lista de espera");
    diaParaEscrita(this.banco, atual.diaId);
    const nova = { ...atual, status };
    this.banco.espera = this.banco.espera.map((e) => (e.id === entradaId ? nova : e));
    this.banco.emitir(atual.diaId, { tipo: "disponibilidade-mudou" });
    return nova;
  }
}

export class SessaoEmMemoria implements SessaoGateway {
  private usuario: Usuario | null = { id: "u1", nome: "Você", email: "voce@expressocafe.com" };

  /** `aoMudar` deixa o container imitar o cookie que a API real grava, para o proxy.ts funcionar igual. */
  constructor(
    private readonly banco: BancoEmMemoria,
    private readonly aoMudar: (usuario: Usuario | null) => void = () => {},
  ) {}

  async entrar(email: string, senha: string): Promise<Usuario> {
    await this.banco.esperar();
    if (!email.includes("@") || senha === "") {
      throw new ErroDeDominio("login-invalido", "E-mail ou senha incorretos.");
    }
    this.usuario = { id: "u1", nome: email.split("@")[0], email };
    this.aoMudar(this.usuario);
    return this.usuario;
  }

  async sair(): Promise<void> {
    this.usuario = null;
    this.aoMudar(null);
  }

  async atual(): Promise<Usuario | null> {
    return this.usuario;
  }
}

export class UsuariosEmMemoria implements UsuariosGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async listar(): Promise<Usuario[]> {
    await this.banco.esperar();
    return [...this.banco.usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async criar({ nome, email }: NovoUsuario): Promise<Usuario> {
    await this.banco.esperar();
    if (this.banco.usuarios.some((u) => u.email === email)) {
      throw new ErroDeDominio("email-ja-existe", "Já existe um usuário com esse e-mail.");
    }
    const usuario = { id: crypto.randomUUID(), nome, email };
    this.banco.usuarios.push(usuario);
    return usuario;
  }

  /** Sem API não há senha de verdade: só confere que algo foi digitado. */
  async mudarSenha(senhaAtual: string): Promise<void> {
    await this.banco.esperar();
    if (senhaAtual === "") throw new ErroDeDominio("senha-atual-incorreta", "A senha atual está incorreta.");
  }
}

export class ConfiguracaoEmMemoria implements ConfiguracaoGateway {
  constructor(private readonly banco: BancoEmMemoria) {}

  async obter(): Promise<Configuracao> {
    await this.banco.esperar();
    return this.banco.configuracao;
  }

  async salvar(configuracao: Configuracao): Promise<Configuracao> {
    await this.banco.esperar();
    this.banco.configuracao = configuracao;
    return configuracao;
  }
}

export class EventosEmMemoria implements EventosTempoReal {
  constructor(private readonly banco: BancoEmMemoria) {}

  assinar(diaId: string, aoReceber: (evento: EventoDoDia) => void): () => void {
    return this.banco.assinar(diaId, aoReceber);
  }
}

/** Guarda as mensagens em vez de abrir o WhatsApp. Útil em testes. */
export class MensageiroEmMemoria implements Mensageiro {
  readonly enviadas: { pedido: Pedido; dia: DiaVenda; configuracao: Configuracao }[] = [];

  enviarConfirmacao(pedido: Pedido, dia: DiaVenda, configuracao: Configuracao): void {
    this.enviadas.push({ pedido, dia, configuracao });
  }
}
