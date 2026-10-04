"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "../../componentes/cx";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

const LINKS = [
  { href: "/dias", rotulo: "Dias de venda" },
  { href: "/produtos", rotulo: "Produtos" },
  { href: "/clientes", rotulo: "Clientes" },
];

/** Casca das telas de gestão, que não pertencem a um dia: dias, produtos e clientes. */
export function LayoutGeral({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  const router = useRouter();
  const { sessao } = useCasosDeUso();

  async function sair() {
    await sessao.sair();
    router.replace("/entrar");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <nav aria-label="Gestão" className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 tablet:px-6">
          <span className="mr-3 py-3 font-display text-titulo whitespace-nowrap">Expresso café</span>
          {LINKS.map((link) => {
            const ativo = caminho === link.href || caminho.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={ativo ? "page" : undefined}
                className={cx(
                  "flex min-h-12 items-center border-b-2 px-3 text-rotulo whitespace-nowrap",
                  ativo ? "border-brasa text-brasa" : "border-transparent text-ink-muted",
                )}
              >
                {link.rotulo}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={sair}
            className="ml-auto flex min-h-12 cursor-pointer items-center px-3 text-rotulo whitespace-nowrap text-ink-muted"
          >
            Sair
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
