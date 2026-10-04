import type { ClienteEncontrado, ClientesGateway } from "@/core/application/portas/ClientesGateway";
import type { AbrirDia, DiasGateway, PainelDoDia, ResumoDia, SugestaoProducao } from "@/core/application/portas/DiasGateway";
import type { EsperaGateway } from "@/core/application/portas/EsperaGateway";
import type { FiltroPedidos, NovoPedido, PedidosGateway, ResultadoCancelamento } from "@/core/application/portas/PedidosGateway";
import type { AlteracaoProducao, ProducaoGateway } from "@/core/application/portas/ProducaoGateway";
import type { ProdutosGateway } from "@/core/application/portas/ProdutosGateway";
import type { SessaoGateway, Usuario } from "@/core/application/portas/SessaoGateway";
import type { Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import type { DiaVenda } from "@/core/domain/dia-venda/DiaVenda";
import type { EstoqueDoProduto, ItemSolicitado } from "@/core/domain/disponibilidade/Disponibilidade";
import type { EntradaEspera } from "@/core/domain/lista-espera/EntradaEspera";
import type { Pagamento, Pedido } from "@/core/domain/pedido/Pedido";
import type { Produto } from "@/core/domain/produto/Produto";
import { type ClienteApi, query } from "./cliente";
import { dinheiro, type PedidoApi, type ProdutoApi, paraPedido, paraProduto } from "./mapeadores";

/** Implementações das portas com a API. As rotas espelham as ações do guia, não as tabelas. */

const id = encodeURIComponent;

export class DiasHttp implements DiasGateway {
  constructor(private readonly api: ClienteApi) {}

  async listar(): Promise<ResumoDia[]> {
    const dias = await this.api.get<(Omit<ResumoDia, "faturamento"> & { faturamento?: number })[]>("/dias");
    return dias.map((d) => ({ ...d, faturamento: d.faturamento == null ? undefined : dinheiro(d.faturamento) }));
  }

  async obterPainel(diaId: string): Promise<PainelDoDia> {
    const painel = await this.api.get<Omit<PainelDoDia, "valorReservado"> & { valorReservado: number }>(`/dias/${id(diaId)}/painel`);
    return { ...painel, valorReservado: dinheiro(painel.valorReservado) };
  }

  sugestaoProducao(): Promise<SugestaoProducao[]> {
    return this.api.get("/dias/sugestao-producao");
  }

  abrir(comando: AbrirDia): Promise<DiaVenda> {
    return this.api.post("/dias", comando);
  }

  fechar(diaId: string): Promise<void> {
    return this.api.post(`/dias/${id(diaId)}/fechamento`);
  }
}

export class PedidosHttp implements PedidosGateway {
  constructor(private readonly api: ClienteApi) {}

  async listar(diaId: string, filtro: FiltroPedidos = {}): Promise<Pedido[]> {
    const pedidos = await this.api.get<PedidoApi[]>(`/dias/${id(diaId)}/pedidos${query({ retirada: filtro.retirada, busca: filtro.busca })}`);
    return pedidos.map(paraPedido);
  }

  async obter(pedidoId: string): Promise<Pedido> {
    return paraPedido(await this.api.get<PedidoApi>(`/pedidos/${id(pedidoId)}`));
  }

  /** 409 vira QuantidadeIndisponivel { maximo } em erros.ts. */
  async criar(pedido: NovoPedido): Promise<Pedido> {
    const { diaId, ...corpo } = pedido;
    return paraPedido(await this.api.post<PedidoApi>(`/dias/${id(diaId)}/pedidos`, corpo));
  }

  async editarItens(pedidoId: string, itens: readonly ItemSolicitado[]): Promise<Pedido> {
    return paraPedido(await this.api.patch<PedidoApi>(`/pedidos/${id(pedidoId)}`, { itens }));
  }

  async marcarRetirado(pedidoId: string): Promise<Pedido> {
    return paraPedido(await this.api.post<PedidoApi>(`/pedidos/${id(pedidoId)}/retirada`));
  }

  async registrarPagamento(pedidoId: string, pagamento: Pagamento): Promise<Pedido> {
    return paraPedido(await this.api.put<PedidoApi>(`/pedidos/${id(pedidoId)}/pagamento`, { pagamento }));
  }

  cancelar(pedidoId: string): Promise<ResultadoCancelamento> {
    return this.api.post(`/pedidos/${id(pedidoId)}/cancelamento`);
  }
}

export class ProducaoHttp implements ProducaoGateway {
  constructor(private readonly api: ClienteApi) {}

  obter(diaId: string): Promise<EstoqueDoProduto[]> {
    return this.api.get(`/dias/${id(diaId)}/producao`);
  }

  salvar(diaId: string, quantidades: readonly { produtoId: string; quantidade: number }[]): Promise<void> {
    return this.api.put(`/dias/${id(diaId)}/producao`, { quantidades });
  }

  historico(diaId: string): Promise<AlteracaoProducao[]> {
    return this.api.get(`/dias/${id(diaId)}/producao/historico`);
  }
}

export class ClientesHttp implements ClientesGateway {
  constructor(private readonly api: ClienteApi) {}

  async buscarPorTelefone(telefone: string): Promise<ClienteEncontrado | null> {
    const encontrados = await this.api.get<ClienteEncontrado[]>(`/clientes${query({ telefone })}`);
    return encontrados[0] ?? null;
  }

  listar(): Promise<ClienteEncontrado[]> {
    return this.api.get("/clientes");
  }
}

export class ProdutosHttp implements ProdutosGateway {
  constructor(private readonly api: ClienteApi) {}

  async listar(): Promise<Produto[]> {
    return (await this.api.get<ProdutoApi[]>("/produtos")).map(paraProduto);
  }

  async criar(produto: { nome: string; preco: Dinheiro }): Promise<Produto> {
    return paraProduto(await this.api.post<ProdutoApi>("/produtos", produto));
  }

  async atualizar(produtoId: string, mudancas: { preco?: Dinheiro; ativo?: boolean }): Promise<Produto> {
    return paraProduto(await this.api.patch<ProdutoApi>(`/produtos/${id(produtoId)}`, mudancas));
  }
}

export class EsperaHttp implements EsperaGateway {
  constructor(private readonly api: ClienteApi) {}

  listar(diaId: string): Promise<EntradaEspera[]> {
    return this.api.get(`/dias/${id(diaId)}/espera`);
  }

  adicionar(entrada: Pick<EntradaEspera, "diaId" | "produtoId" | "cliente" | "quantidade">): Promise<EntradaEspera> {
    const { diaId, ...corpo } = entrada;
    return this.api.post(`/dias/${id(diaId)}/espera`, corpo);
  }

  mudarStatus(entradaId: string, status: EntradaEspera["status"]): Promise<EntradaEspera> {
    return this.api.patch(`/espera/${id(entradaId)}`, { status });
  }
}

export class SessaoHttp implements SessaoGateway {
  constructor(private readonly api: ClienteApi) {}

  /** A API grava o cookie httpOnly com Domain do site, para o proxy.ts do Next enxergar. */
  entrar(email: string, senha: string): Promise<Usuario> {
    return this.api.post("/sessao", { email, senha });
  }

  sair(): Promise<void> {
    return this.api.delete("/sessao");
  }

  async atual(): Promise<Usuario | null> {
    try {
      return await this.api.get<Usuario>("/sessao");
    } catch {
      return null;
    }
  }
}
