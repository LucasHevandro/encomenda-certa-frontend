/** Chaves do cache do TanStack Query. Tudo de um dia começa com ["dia", diaId]. */
export const chaves = {
  dias: () => ["dias"] as const,
  dia: (diaId: string) => ["dia", diaId] as const,
  painel: (diaId: string) => ["dia", diaId, "painel"] as const,
  pedidos: (diaId: string, filtro?: object) => ["dia", diaId, "pedidos", filtro ?? {}] as const,
  pedido: (pedidoId: string) => ["pedido", pedidoId] as const,
};
