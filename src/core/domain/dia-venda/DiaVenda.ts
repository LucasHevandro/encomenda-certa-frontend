export type StatusDia = "aberto" | "encerrado";

export interface DiaVenda {
  readonly id: string;
  /** Data no formato ISO (2026-10-04). Pode ser sábado ou domingo. */
  readonly data: string;
  readonly status: StatusDia;
}

export function estaAberto(dia: DiaVenda): boolean {
  return dia.status === "aberto";
}
