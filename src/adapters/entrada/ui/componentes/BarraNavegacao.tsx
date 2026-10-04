"use client";

import Link from "next/link";
import { cx } from "./cx";
import { Icone, type NomeIcone } from "./Icone";

export type ItemNavegacao = "inicio" | "pedidos" | "novo" | "producao" | "mais";

const ITENS: { id: ItemNavegacao; rotulo: string; icone: NomeIcone }[] = [
  { id: "inicio", rotulo: "Início", icone: "inicio" },
  { id: "pedidos", rotulo: "Pedidos", icone: "pedidos" },
  { id: "novo", rotulo: "+ Pedido", icone: "mais" },
  { id: "producao", rotulo: "Produção", icone: "producao" },
  { id: "mais", rotulo: "Mais", icone: "menu" },
];

/**
 * Barra inferior no celular e no tablet (Início | Pedidos | + Pedido | Produção | Mais).
 * A partir do desktop vira coluna lateral, com os mesmos itens na mesma ordem.
 */
export function BarraNavegacao({
  ativo,
  links,
  aoAbrirMais,
}: {
  ativo?: ItemNavegacao;
  links: Record<Exclude<ItemNavegacao, "mais">, string>;
  aoAbrirMais: () => void;
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 grid min-h-[72px] grid-cols-5 items-end border-t border-line bg-surface-raised px-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-flutuante",
        "desktop:inset-y-0 desktop:right-auto desktop:flex desktop:w-60 desktop:flex-col desktop:items-stretch desktop:gap-1 desktop:border-t-0 desktop:border-r desktop:px-3 desktop:pt-6 desktop:shadow-none",
      )}
    >
      <p className="hidden px-3 pb-4 font-display text-titulo desktop:order-[-2] desktop:block">Expresso café</p>
      {ITENS.map((item) => {
        const marcado = item.id === ativo;
        const fab = item.id === "novo";
        const classe = cx(
          "flex min-h-12 cursor-pointer flex-col items-center gap-0.5 rounded-md border-0 bg-transparent pt-1.5 text-ink-muted",
          "desktop:flex-row desktop:gap-3 desktop:px-3 desktop:py-2",
          marcado && "text-brasa",
          fab && "text-ink desktop:order-[-1] desktop:mb-3 desktop:bg-brasa desktop:text-on-brasa",
        );
        const icone = (
          <span
            className={cx(
              "grid h-[30px] w-14 place-items-center rounded-full desktop:h-auto desktop:w-auto",
              marcado && "bg-brasa-soft desktop:bg-transparent",
              fab && "-mt-7 size-16 bg-brasa text-on-brasa shadow-flutuante desktop:mt-0 desktop:size-auto desktop:shadow-none",
            )}
          >
            <Icone nome={item.icone} tamanho={fab ? 30 : 24} className={fab ? "desktop:size-6" : undefined} />
          </span>
        );
        const rotulo = (
          <span className={cx("text-legenda font-semibold desktop:text-corpo", fab && "font-bold")}>
            {fab ? <><span className="desktop:hidden">+ Pedido</span><span className="hidden desktop:inline">Novo pedido</span></> : item.rotulo}
          </span>
        );
        if (item.id === "mais") {
          return (
            <button key={item.id} type="button" onClick={aoAbrirMais} className={classe} aria-haspopup="dialog">
              {icone}
              {rotulo}
            </button>
          );
        }
        return (
          <Link
            key={item.id}
            href={links[item.id]}
            className={classe}
            aria-current={marcado ? "page" : undefined}
            aria-label={fab ? "Novo pedido" : undefined}
          >
            {icone}
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
