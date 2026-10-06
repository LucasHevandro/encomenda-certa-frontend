"use client";

import { useSyncExternalStore } from "react";
import { assinarTema, escolherTema, temaAtual } from "../tema";
import { cx } from "./cx";
import { Icone } from "./Icone";

/** O tema na tela e o oposto, para onde o botão leva. */
export function useTema() {
  // No servidor não há tema: nasce "claro" e se acerta ao hidratar.
  const tema = useSyncExternalStore(assinarTema, temaAtual, () => "claro" as const);
  const proximo = tema === "escuro" ? "claro" : "escuro";
  return { tema, proximo, alternar: () => escolherTema(proximo) } as const;
}

/** Troca entre claro e escuro neste aparelho. Mostra o tema para o qual vai mudar. */
export function BotaoTema({ className, compacto }: { className?: string; compacto?: boolean }) {
  const { proximo, alternar } = useTema();

  return (
    <button
      type="button"
      onClick={alternar}
      className={cx("flex min-h-12 cursor-pointer items-center gap-1.5 px-3 text-rotulo whitespace-nowrap text-ink-muted", className)}
    >
      <Icone nome={proximo === "escuro" ? "lua" : "sol"} tamanho={20} />
      {/* Compacto: só o ícone no celular, com o nome para leitores de tela. */}
      <span className={compacto ? "sr-only tablet:not-sr-only" : undefined}>{proximo === "escuro" ? "Tema escuro" : "Tema claro"}</span>
    </button>
  );
}
