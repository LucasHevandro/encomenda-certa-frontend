import type { ConfiguracaoGateway } from "@/core/application/portas/ConfiguracaoGateway";
import type { Configuracao } from "@/core/domain/configuracao/Configuracao";
import type { ClienteEncontrado, ClientesGateway } from "@/core/application/portas/ClientesGateway";
import type { AbrirDia, DiasGateway, PainelDoDia, ResumoDia, SugestaoProducao } from "@/core/application/portas/DiasGateway";
import type { EsperaGateway } from "@/core/application/portas/EsperaGateway";
import type { FiltroPedidos, NovoPedido, PedidosGateway, ResultadoCancelamento } from "@/core/application/portas/PedidosGateway";
import type { AlteracaoProducao, ProducaoGateway } from "@/core/application/portas/ProducaoGateway";
import type { ProdutosGateway } from "@/core/application/portas/ProdutosGateway";
import type { SessaoGateway, Usuario } from "@/core/application/portas/SessaoGateway";
import type { NovoUsuario, UsuariosGateway } from "@/core/application/portas/UsuariosGateway";
import type { PedidoDoHistorico } from "@/core/domain/cliente/Historico";
import type { Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import type { DiaVenda } from "@/core/domain/dia-venda/DiaVenda";
import type { EstoqueDoProduto, ItemSolicitado } from "@/core/domain/disponibilidade/Disponibilidade";
import type { DiaFechado } from "@/core/domain/fechamento/Fechamento";
import type { EntradaEspera } from "@/core/domain/lista-espera/EntradaEspera";
import type { Pagamento, Pedido } from "@/core/domain/pedido/Pedido";
import type { Produto } from "@/core/domain/produto/Produto";
import type { ApiTipada } from "./apiTipada";
import { dinheiro, paraConfiguracao, paraPedido, paraProduto } from "./mapeadores";

/**
 * Implementações das portas com a API. As rotas e os formatos vêm do openapi.json do
 * backend (tipos em schema.d.ts): uma rota errada aqui não compila.
 */

export class DiasHttp implements DiasGateway {
  constructor(private readonly api: ApiTipada) {}

  async listar(): Promise<ResumoDia[]> {
    const dias = await this.api.chamar("get", "/dias");
    return dias.map((d) => ({ ...d, faturamento: d.faturamento == null ? undefined : dinheiro(d.faturamento) }));
  }

  async obterPainel(diaId: string): Promise<PainelDoDia> {
    const painel = await this.api.chamar("get", "/dias/{id}/painel", { id: diaId });
    return { ...painel, valorReservado: dinheiro(painel.valorReservado) };
  }

  sugestaoProducao(): Promise<SugestaoProducao[]> {
    return this.api.chamar("get", "/dias/sugestao-producao");
  }

  async relatorio(dias: number): Promise<DiaFechado[]> {
    const fotos = await this.api.chamar("get", "/dias/relatorio", { query: { dias: String(dias) } });
    return fotos.map((f) => ({ ...f, faturamento: dinheiro(f.faturamento) }));
  }

  abrir(comando: AbrirDia): Promise<DiaVenda> {
    return this.api.chamar("post", "/dias", { corpo: { data: comando.data, producao: [...comando.producao] } });
  }

  async fechar(diaId: string): Promise<void> {
    await this.api.chamar("post", "/dias/{id}/fechamento", { id: diaId });
  }
}

export class PedidosHttp implements PedidosGateway {
  constructor(private readonly api: ApiTipada) {}

  async listar(diaId: string, filtro: FiltroPedidos = {}): Promise<Pedido[]> {
    const pedidos = await this.api.chamar("get", "/dias/{id}/pedidos", { id: diaId, query: { retirada: filtro.retirada, busca: filtro.busca } });
    return pedidos.map(paraPedido);
  }

  async obter(pedidoId: string): Promise<Pedido> {
    return paraPedido(await this.api.chamar("get", "/pedidos/{id}", { id: pedidoId }));
  }

  /** 409 vira QuantidadeIndisponivel { maximo } em erros.ts. */
  async criar(pedido: NovoPedido): Promise<Pedido> {
    const corpo = { cliente: pedido.cliente, itens: [...pedido.itens] };
    return paraPedido(await this.api.chamar("post", "/dias/{id}/pedidos", { id: pedido.diaId, corpo }));
  }

  async editarItens(pedidoId: string, itens: readonly ItemSolicitado[]): Promise<Pedido> {
    return paraPedido(await this.api.chamar("patch", "/pedidos/{id}", { id: pedidoId, corpo: { itens: [...itens] } }));
  }

  async marcarRetirado(pedidoId: string): Promise<Pedido> {
    return paraPedido(await this.api.chamar("post", "/pedidos/{id}/retirada", { id: pedidoId }));
  }

  async registrarPagamento(pedidoId: string, pagamento: Pagamento): Promise<Pedido> {
    return paraPedido(await this.api.chamar("put", "/pedidos/{id}/pagamento", { id: pedidoId, corpo: { pagamento } }));
  }

  cancelar(pedidoId: string): Promise<ResultadoCancelamento> {
    return this.api.chamar("post", "/pedidos/{id}/cancelamento", { id: pedidoId });
  }

  /** 409 vira QuantidadeIndisponivel { maximo } em erros.ts. */
  async reativar(pedidoId: string): Promise<Pedido> {
    return paraPedido(await this.api.chamar("post", "/pedidos/{id}/reativacao", { id: pedidoId }));
  }
}

export class ProducaoHttp implements ProducaoGateway {
  constructor(private readonly api: ApiTipada) {}

  obter(diaId: string): Promise<EstoqueDoProduto[]> {
    return this.api.chamar("get", "/dias/{id}/producao", { id: diaId });
  }

  async salvar(diaId: string, quantidades: readonly { produtoId: string; quantidade: number }[]): Promise<void> {
    await this.api.chamar("put", "/dias/{id}/producao", { id: diaId, corpo: { quantidades: [...quantidades] } });
  }

  historico(diaId: string): Promise<AlteracaoProducao[]> {
    return this.api.chamar("get", "/dias/{id}/producao/historico", { id: diaId });
  }
}

export class ClientesHttp implements ClientesGateway {
  constructor(private readonly api: ApiTipada) {}

  async buscarPorTelefone(telefone: string): Promise<ClienteEncontrado | null> {
    const encontrados = await this.api.chamar("get", "/clientes", { query: { telefone } });
    return encontrados[0] ?? null;
  }

  listar(): Promise<ClienteEncontrado[]> {
    return this.api.chamar("get", "/clientes");
  }

  async historico(clienteId: string): Promise<{ cliente: ClienteEncontrado; pedidos: PedidoDoHistorico[] }> {
    const { cliente, pedidos } = await this.api.chamar("get", "/clientes/{id}", { id: clienteId });
    return { cliente, pedidos: pedidos.map((p) => ({ ...paraPedido(p), data: p.data })) };
  }
}

export class ProdutosHttp implements ProdutosGateway {
  constructor(private readonly api: ApiTipada) {}

  async listar(): Promise<Produto[]> {
    return (await this.api.chamar("get", "/produtos")).map(paraProduto);
  }

  async criar(produto: { nome: string; preco: Dinheiro }): Promise<Produto> {
    return paraProduto(await this.api.chamar("post", "/produtos", { corpo: produto }));
  }

  async atualizar(produtoId: string, mudancas: { preco?: Dinheiro; ativo?: boolean }): Promise<Produto> {
    return paraProduto(await this.api.chamar("patch", "/produtos/{id}", { id: produtoId, corpo: mudancas }));
  }
}

export class EsperaHttp implements EsperaGateway {
  constructor(private readonly api: ApiTipada) {}

  listar(diaId: string): Promise<EntradaEspera[]> {
    return this.api.chamar("get", "/dias/{id}/espera", { id: diaId });
  }

  adicionar(entrada: Pick<EntradaEspera, "diaId" | "produtoId" | "cliente" | "quantidade">): Promise<EntradaEspera> {
    const corpo = { produtoId: entrada.produtoId, cliente: entrada.cliente, quantidade: entrada.quantidade };
    return this.api.chamar("post", "/dias/{id}/espera", { id: entrada.diaId, corpo });
  }

  mudarStatus(entradaId: string, status: EntradaEspera["status"]): Promise<EntradaEspera> {
    return this.api.chamar("patch", "/espera/{id}", { id: entradaId, corpo: { status } });
  }
}

export class UsuariosHttp implements UsuariosGateway {
  constructor(private readonly api: ApiTipada) {}

  listar(): Promise<Usuario[]> {
    return this.api.chamar("get", "/usuarios");
  }

  criar(usuario: NovoUsuario): Promise<Usuario> {
    return this.api.chamar("post", "/usuarios", { corpo: usuario });
  }

  async mudarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    await this.api.chamar("put", "/sessao/senha", { corpo: { senhaAtual, novaSenha } });
  }
}

export class ConfiguracaoHttp implements ConfiguracaoGateway {
  constructor(private readonly api: ApiTipada) {}

  async obter(): Promise<Configuracao> {
    return paraConfiguracao(await this.api.chamar("get", "/configuracao"));
  }

  async salvar(configuracao: Configuracao): Promise<Configuracao> {
    const corpo = { ...configuracao, diasDeVenda: [...configuracao.diasDeVenda], formasDePagamento: [...configuracao.formasDePagamento] };
    return paraConfiguracao(await this.api.chamar("put", "/configuracao", { corpo }));
  }
}

export class SessaoHttp implements SessaoGateway {
  constructor(private readonly api: ApiTipada) {}

  /** A API grava o cookie httpOnly; com /api ele fica no endereço do app e o proxy.ts enxerga. */
  entrar(email: string, senha: string): Promise<Usuario> {
    return this.api.chamar("post", "/sessao", { corpo: { email, senha } });
  }

  async sair(): Promise<void> {
    await this.api.chamar("delete", "/sessao");
  }

  async atual(): Promise<Usuario | null> {
    try {
      return await this.api.chamar("get", "/sessao");
    } catch {
      return null;
    }
  }
}
