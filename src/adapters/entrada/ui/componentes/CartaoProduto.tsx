import type { ReactNode } from "react";
import { cx } from "./cx";
import { ESTADOS, Status } from "./Status";
import { TOM_PREENCHIMENTO, TOM_TEXTO } from "./tons";

export interface CartaoProdutoProps {
  nome: string;
  producao: number;
  reservados: number;
  vendidos?: number;
  limiteAtencao?: number;
  /** Rodapé: lista de espera, "Ajustar produção". */
  children?: ReactNode;
}

export function estadoDisponibilidade(disponiveis: number, limiteAtencao = 3) {
  if (disponiveis <= 0) return "esgotado" as const;
  if (disponiveis <= limiteAtencao) return "atencao" as const;
  return "disponivel" as const;
}

/** Responde "quanto ainda posso vender?" com o número grande na cor do estado. */
export function CartaoProduto({ nome, producao, reservados, vendidos = 0, limiteAtencao = 3, children }: CartaoProdutoProps) {
  const disponiveis = Math.max(0, producao - reservados - vendidos);
  const estado = estadoDisponibilidade(disponiveis, limiteAtencao);
  const tom = ESTADOS[estado].tom;
  const comprometido = producao ? Math.min(100, Math.round(((reservados + vendidos) / producao) * 100)) : 100;

  return (
    <article
      className={cx(
        "flex flex-col gap-3 rounded-lg border bg-surface-raised p-4 shadow-cartao",
        estado === "esgotado" ? "border-[1.5px] border-critico" : estado === "atencao" ? "border-[1.5px] border-alerta" : "border-line",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="m-0 font-display text-titulo">{nome}</h3>
        <Status estado={estado} />
      </header>
      <div className={cx("flex items-baseline gap-2", TOM_TEXTO[tom])}>
        <span className="font-display text-numero-xl tabular-nums">{disponiveis}</span>
        <span className="text-[17px] font-semibold">
          {disponiveis === 0 ? "nenhum disponível" : disponiveis === 1 ? "disponível" : "disponíveis"}
        </span>
      </div>
      <div role="img" aria-label={`${comprometido}% da produção comprometida`} className="h-2 overflow-hidden rounded-sm bg-surface-sunken">
        <span className={cx("block h-full rounded-[inherit]", TOM_PREENCHIMENTO[tom])} style={{ width: `${comprometido}%` }} />
      </div>
      <dl className="m-0 grid grid-cols-3 gap-2">
        <Metrica rotulo="Produção" valor={producao} />
        <Metrica rotulo="Reservados" valor={reservados} />
        <Metrica rotulo="Vendidos" valor={vendidos} />
      </dl>
      {children && <div className="border-t border-line pt-3">{children}</div>}
    </article>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div>
      <dt className="text-rotulo text-ink-muted">{rotulo}</dt>
      <dd className="m-0 text-[20px] leading-7 font-bold tabular-nums">{valor}</dd>
    </div>
  );
}
