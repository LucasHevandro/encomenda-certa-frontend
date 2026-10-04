import type { ReactNode } from "react";
import { cx } from "./cx";

/** Grade 2×2 de números grandes. No máximo quatro; destaque só na disponibilidade. */
export function Resumo({ itens }: { itens: { valor: ReactNode; rotulo: string; destaque?: boolean }[] }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-3">
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className={cx(
            "flex flex-col-reverse gap-1 rounded-lg border bg-surface-raised p-4",
            item.destaque ? "border-[1.5px] border-ok" : "border-line",
          )}
        >
          <dt className="text-rotulo text-ink-muted">{item.rotulo}</dt>
          <dd className={cx("m-0 font-display text-numero-lg tabular-nums", item.destaque && "text-ok")}>{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
