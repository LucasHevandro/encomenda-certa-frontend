import Link from "next/link";
import { cx } from "./cx";
import { Status } from "./Status";

export interface CartaoPedidoProps {
  /** Já formatado: "#0258". */
  numero: string;
  cliente: string;
  /** Linhas curtas: "2 Frangos assados". */
  itens: string[];
  total: string;
  estado: "reservado" | "retirado" | "cancelado" | "pendente";
  pagamento?: "pago" | "naoPago";
  href: string;
}

/** Uma linha do caderno. O cartão inteiro abre o detalhe; nada de botões dentro. */
export function CartaoPedido({ numero, cliente, itens, total, estado, pagamento, href }: CartaoPedidoProps) {
  const cancelado = estado === "cancelado";
  return (
    <Link
      href={href}
      className="flex w-full flex-col gap-2 rounded-lg border border-line bg-surface-raised p-4 text-left shadow-cartao active:bg-surface-sunken"
    >
      <div className="flex items-baseline gap-2 text-[17px]">
        <span className="font-bold text-ink-muted tabular-nums">{numero}</span>
        <span className="font-bold">{cliente}</span>
      </div>
      <ul className={cx("m-0 list-none p-0", cancelado && "text-ink-muted line-through")}>
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cx("text-[17px] font-bold tabular-nums", cancelado && "text-ink-muted line-through")}>{total}</span>
        <span className="inline-flex flex-wrap gap-2">
          {pagamento && <Status estado={pagamento} />}
          <Status estado={estado} />
        </span>
      </div>
    </Link>
  );
}
