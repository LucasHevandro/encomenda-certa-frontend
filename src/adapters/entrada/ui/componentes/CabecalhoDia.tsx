import type { ReactNode } from "react";

/** Topo das telas operacionais: diz qual dia de venda está aberto. */
export function CabecalhoDia({ data, sobretitulo, acao }: { data: string; sobretitulo: string; acao?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pt-6 pb-3">
      <div>
        <p className="m-0 mb-0.5 text-rotulo tracking-[.06em] text-brasa uppercase">{sobretitulo}</p>
        <h1 className="m-0 font-display text-display">{data}</h1>
      </div>
      {acao}
    </header>
  );
}
