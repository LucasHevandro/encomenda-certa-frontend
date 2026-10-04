"use client";

import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cx } from "./cx";

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  dica?: string;
  erro?: string;
  /** Nó abaixo do campo, como o cliente encontrado pelo telefone. */
  sugestao?: ReactNode;
}

/** Campo de 56px com rótulo sempre visível. */
export function Campo({ rotulo, dica, erro, sugestao, className, id, ...resto }: CampoProps) {
  const gerado = useId();
  const idCampo = id ?? gerado;
  const idDescricao = erro || dica ? `${idCampo}-d` : undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={idCampo} className="text-rotulo">
        {rotulo}
      </label>
      <input
        id={idCampo}
        aria-invalid={!!erro}
        aria-describedby={idDescricao}
        {...resto}
        className={cx(
          "min-h-14 w-full rounded-md border-[1.5px] bg-surface-raised px-4 text-[17px] text-ink placeholder:text-ink-muted",
          erro ? "border-critico" : "border-line-strong",
        )}
      />
      {sugestao}
      {idDescricao && (
        <p id={idDescricao} className={cx("m-0 text-legenda", erro ? "font-semibold text-critico" : "text-ink-muted")}>
          {erro ?? dica}
        </p>
      )}
    </div>
  );
}
