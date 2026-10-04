import type { HTMLAttributes } from "react";
import { cx } from "./cx";

/** Superfície elevada com borda, raio grande e sombra discreta. */
export function Cartao({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div {...resto} className={cx("rounded-lg border border-line bg-surface-raised p-4 shadow-cartao", className)} />;
}
