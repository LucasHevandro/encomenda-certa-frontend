import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icone, type NomeIcone } from "./Icone";
import { TOM_SELO, type Tom } from "./tons";

export type Estado =
  | "disponivel"
  | "atencao"
  | "esgotado"
  | "reservado"
  | "retirado"
  | "cancelado"
  | "pendente"
  | "espera"
  | "pago"
  | "naoPago";

export const ESTADOS: Record<Estado, { tom: Tom; icone: NomeIcone; rotulo: string }> = {
  disponivel: { tom: "ok", icone: "check", rotulo: "Disponível" },
  atencao: { tom: "alerta", icone: "alerta", rotulo: "Atenção" },
  esgotado: { tom: "critico", icone: "esgotado", rotulo: "Esgotado" },
  reservado: { tom: "alerta", icone: "relogio", rotulo: "Reservado" },
  retirado: { tom: "ok", icone: "check", rotulo: "Retirado" },
  cancelado: { tom: "neutro", icone: "fechar", rotulo: "Cancelado" },
  pendente: { tom: "alerta", icone: "relogio", rotulo: "Retirada pendente" },
  espera: { tom: "info", icone: "espera", rotulo: "Lista de espera" },
  pago: { tom: "ok", icone: "moeda", rotulo: "Pago" },
  naoPago: { tom: "neutro", icone: "moeda", rotulo: "Não pago" },
};

/** Selo de estado: ícone + palavra, nunca só cor. */
export function Status({ estado, grande, children }: { estado: Estado; grande?: boolean; children?: ReactNode }) {
  const e = ESTADOS[estado];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        grande ? "py-1.5 pr-3.5 pl-2.5 text-corpo" : "py-1 pr-2.5 pl-2 text-rotulo",
        TOM_SELO[e.tom],
      )}
    >
      <Icone nome={e.icone} tamanho={grande ? 18 : 16} />
      <span>{children ?? e.rotulo}</span>
    </span>
  );
}
