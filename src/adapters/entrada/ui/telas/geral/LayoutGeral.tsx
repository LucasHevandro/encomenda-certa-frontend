"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "../../componentes/cx";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

const LINKS = [
  { href: "/dias", rotulo: "Dias de venda", curto: "Dias" },
  { href: "/produtos", rotulo: "Produtos", curto: "Produtos" },
  { href: "/clientes", rotulo: "Clientes", curto: "Clientes" },
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
      {/* Celular: nome e Sair em cima, as três abas dividindo a largura embaixo. Tablet em diante: uma linha só. */}
      <nav aria-label="Gestão" className="border-b border-line bg-surface-raised">
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center px-4 tablet:flex tablet:gap-1 tablet:px-6">
          <span className="py-3 font-display text-titulo whitespace-nowrap tablet:mr-3">Expresso café</span>
          <button
            type="button"
            onClick={sair}
            className="flex min-h-12 cursor-pointer items-center px-3 text-rotulo whitespace-nowrap text-ink-muted tablet:order-last tablet:ml-auto"
          >
            Sair
          </button>
          <div className="col-span-2 -mx-4 grid grid-cols-3 border-t border-line tablet:mx-0 tablet:flex tablet:border-t-0">
            {LINKS.map((link) => {
              const ativo = caminho === link.href || caminho.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={ativo ? "page" : undefined}
                  className={cx(
                    "flex min-h-12 items-center justify-center border-b-2 px-3 text-rotulo whitespace-nowrap",
                    ativo ? "border-brasa text-brasa" : "border-transparent text-ink-muted",
                  )}
                >
                  <span className="tablet:hidden">{link.curto}</span>
                  <span className="hidden tablet:inline">{link.rotulo}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
