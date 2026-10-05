/** Chaves do cache do TanStack Query. Tudo de um dia começa com ["dia", diaId]. */
export const chaves = {
  sessao: () => ["sessao"] as const,
  dias: () => ["dias"] as const,
  prontoParaAbrir: () => ["dias", "novo"] as const,
  dia: (diaId: string) => ["dia", diaId] as const,
  painel: (diaId: string) => ["dia", diaId, "painel"] as const,
  pedidos: (diaId: string, filtro?: object) => ["dia", diaId, "pedidos", filtro ?? {}] as const,
  pedido: (diaId: string, pedidoId: string) => ["dia", diaId, "pedido", pedidoId] as const,
  producao: (diaId: string) => ["dia", diaId, "producao"] as const,
  historicoProducao: (diaId: string) => ["dia", diaId, "producao", "historico"] as const,
  espera: (diaId: string) => ["dia", diaId, "espera"] as const,
  fechamento: (diaId: string) => ["dia", diaId, "fechamento"] as const,
  produtos: () => ["produtos"] as const,
  usuarios: () => ["usuarios"] as const,
  clientes: () => ["clientes"] as const,
  cliente: (clienteId: string) => ["clientes", "historico", clienteId] as const,
  clientePorTelefone: (digitos: string) => ["clientes", "telefone", digitos] as const,
};
