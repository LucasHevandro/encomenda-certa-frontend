export type EventoDoDia =
  | { readonly tipo: "disponibilidade-mudou" }
  | { readonly tipo: "unidades-liberadas"; readonly produtoId: string; readonly quantidade: number }
  /** Um cliente acabou de reservar pela página pública. */
  | { readonly tipo: "pedido-online"; readonly numero: number; readonly cliente: string };

export interface EventosTempoReal {
  /** Começa a ouvir os eventos de um dia. Devolve a função que para de ouvir. */
  assinar(diaId: string, aoReceber: (evento: EventoDoDia) => void): () => void;
}
