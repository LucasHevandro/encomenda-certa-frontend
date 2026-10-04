import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import { Icone, type NomeIcone } from "./Icone";

export type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo";

const VARIANTES: Record<VarianteBotao, string> = {
  primario: "bg-brasa text-on-brasa hover:bg-brasa-hover active:bg-brasa-hover",
  secundario: "bg-surface-raised text-ink border-line-strong active:bg-surface-sunken",
  fantasma: "bg-transparent text-ink active:bg-surface-sunken",
  perigo: "bg-critico-soft text-critico border-critico",
};

export interface EstiloBotao {
  variante?: VarianteBotao;
  /** lg = 56px (padrão), md = 48px. */
  tamanho?: "lg" | "md";
  bloco?: boolean;
}

/** Classes do botão, para usar também em links que parecem botão. */
export function classesBotao({ variante = "primario", tamanho = "lg", bloco }: EstiloBotao, extra?: string) {
  return cx(
    "cursor-pointer items-center justify-center gap-2 rounded-md border-[1.5px] border-transparent font-semibold transition-colors duration-[120ms]",
    "disabled:cursor-not-allowed disabled:opacity-45",
    tamanho === "lg" ? "min-h-14 px-5 text-[17px]" : "min-h-12 px-4 text-corpo",
    bloco ? "flex w-full" : "inline-flex",
    VARIANTES[variante],
    extra,
  );
}

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement>, EstiloBotao {
  icone?: NomeIcone;
}

/** Botão com verbo no rótulo. No máximo um primário por tela. */
export function Botao({ variante, tamanho = "lg", bloco, icone, className, children, type = "button", ...resto }: BotaoProps) {
  return (
    <button type={type} {...resto} className={classesBotao({ variante, tamanho, bloco }, className)}>
      {icone && <Icone nome={icone} tamanho={tamanho === "lg" ? 22 : 20} />}
      <span>{children}</span>
    </button>
  );
}
