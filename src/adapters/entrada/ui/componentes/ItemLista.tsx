import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icone, type NomeIcone } from "./Icone";

export interface ItemListaProps {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  icone?: NomeIcone;
  direita?: ReactNode;
  /** Com href ou onClick o item vira tocável e mostra a seta. */
  href?: string;
  onClick?: () => void;
}

const BASE =
  "flex min-h-16 w-full items-center gap-3 border-0 border-b border-line bg-surface-raised px-4 py-3 text-left text-ink last:border-b-0";

/** Linha de 64px para listas simples (clientes, dias, espera). Agrupe dentro de GrupoLista. */
export function ItemLista({ titulo, subtitulo, icone, direita, href, onClick }: ItemListaProps) {
  const conteudo = (
    <>
      {icone && (
        <span className="grid size-10 flex-none place-items-center rounded-full bg-surface-sunken text-ink-muted">
          <Icone nome={icone} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[17px] leading-6 font-semibold">{titulo}</span>
        {subtitulo && <span className="text-rotulo font-normal text-ink-muted">{subtitulo}</span>}
      </span>
      {direita && <span className="font-bold tabular-nums">{direita}</span>}
      {(href || onClick) && <Icone nome="seta" className="text-ink-muted" />}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cx(BASE, "active:bg-surface-sunken")}>
        {conteudo}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx(BASE, "cursor-pointer active:bg-surface-sunken")}>
        {conteudo}
      </button>
    );
  }
  return <div className={BASE}>{conteudo}</div>;
}

/** Contêiner com raio grande e borda para agrupar ItemLista. */
export function GrupoLista({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-line bg-surface-raised">{children}</div>;
}
