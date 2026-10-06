import type { AlteracaoProducao } from "@/core/application/portas/ProducaoGateway";
import type { ClienteEncontrado } from "@/core/application/portas/ClientesGateway";
import type { Empresa } from "@/core/application/portas/EmpresasGateway";
import type { Usuario } from "@/core/application/portas/SessaoGateway";
import type { EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import type { SugestaoProducao } from "@/core/application/portas/DiasGateway";
import type { Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import type { DiaVenda } from "@/core/domain/dia-venda/DiaVenda";
import type { EstoqueDoProduto } from "@/core/domain/disponibilidade/Disponibilidade";
import type { EntradaEspera } from "@/core/domain/lista-espera/EntradaEspera";
import type { Pedido } from "@/core/domain/pedido/Pedido";
import { CONFIGURACAO_PADRAO, type Configuracao } from "@/core/domain/configuracao/Configuracao";
import type { Produto } from "@/core/domain/produto/Produto";

/**
 * Estado compartilhado pelos gateways em memória, no lugar do banco e da API.
 * Vive só na memória do navegador: recarregar a página volta aos dados iniciais.
 */
export class BancoEmMemoria {
  configuracao: Configuracao = CONFIGURACAO_PADRAO;
  produtos: Produto[] = [];
  usuarios: Usuario[] = [];
  /** Só o painel do administrador usa; o resto do modo memória é uma empresa só. */
  empresas: Empresa[] = [];
  dias: DiaVenda[] = [];
  /** diaId → (produtoId → quantidade produzida). */
  producao = new Map<string, Map<string, number>>();
  pedidos: Pedido[] = [];
  clientes: ClienteEncontrado[] = [];
  espera: EntradaEspera[] = [];
  alteracoes: (AlteracaoProducao & { diaId: string })[] = [];
  /** Resultado gravado ao fechar o dia. */
  fechamentos = new Map<string, { faturamento: Dinheiro; sobras: number }>();
  historicoProducao: SugestaoProducao[] = [];
  proximoNumero = 1;

  private ouvintes = new Map<string, Set<(evento: EventoDoDia) => void>>();

  constructor(private readonly atrasoMs = 0) {}

  /** Simula o tempo de rede, para ver os estados de carregamento nas telas. */
  esperar(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.atrasoMs));
  }

  estoques(diaId: string): EstoqueDoProduto[] {
    const doDia = this.producao.get(diaId) ?? new Map<string, number>();
    return [...doDia].map(([produtoId, producao]) => {
      let reservados = 0;
      let vendidos = 0;
      for (const pedido of this.pedidos) {
        if (pedido.diaId !== diaId) continue;
        for (const item of pedido.itens) {
          if (item.produtoId !== produtoId) continue;
          if (pedido.retirada === "reservado") reservados += item.quantidade;
          if (pedido.retirada === "retirado") vendidos += item.quantidade;
        }
      }
      const nome = this.produtos.find((p) => p.id === produtoId)?.nome ?? produtoId;
      return { produtoId, nome, producao, reservados, vendidos };
    });
  }

  assinar(diaId: string, ouvinte: (evento: EventoDoDia) => void): () => void {
    const lista = this.ouvintes.get(diaId) ?? new Set();
    lista.add(ouvinte);
    this.ouvintes.set(diaId, lista);
    return () => lista.delete(ouvinte);
  }

  emitir(diaId: string, evento: EventoDoDia): void {
    for (const ouvinte of this.ouvintes.get(diaId) ?? []) ouvinte(evento);
  }
}
