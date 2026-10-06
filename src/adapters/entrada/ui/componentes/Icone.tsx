import { cx } from "./cx";

const CIRCULO = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z";

const ICONES = {
  mais: ["M12 5v14", "M5 12h14"],
  menos: ["M5 12h14"],
  check: ["M5 12.5l4.5 4.5L19 7"],
  fechar: ["M6 6l12 12", "M18 6L6 18"],
  relogio: [CIRCULO, "M12 7v5l3 2"],
  busca: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M20 20l-4-4"],
  inicio: ["M4 11l8-7 8 7", "M6 9.5V20h12V9.5"],
  pedidos: ["M9 6h11", "M9 12h11", "M9 18h11", "M4.5 6h.01", "M4.5 12h.01", "M4.5 18h.01"],
  producao: ["M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"],
  menu: ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
  alerta: ["M12 4L2.5 20h19L12 4z", "M12 10v4", "M12 17h.01"],
  esgotado: [CIRCULO, "M5.6 5.6l12.8 12.8"],
  espera: ["M7 3h10", "M7 21h10", "M8 3v3l4 6-4 6v3", "M16 3v3l-4 6 4 6v3"],
  mensagem: ["M4 5h16v11H9l-5 4V5z"],
  moeda: [
    CIRCULO,
    "M12 7v10",
    "M14.5 9.5c0-1-1-1.8-2.5-1.8s-2.5.8-2.5 1.9 1 1.6 2.5 1.9 2.5.9 2.5 2-1 2-2.5 2-2.5-.8-2.5-1.8",
  ],
  seta: ["M9 6l6 6-6 6"],
  sol: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 2v2", "M12 20v2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M2 12h2", "M20 12h2", "M4.9 19.1l1.4-1.4", "M17.7 6.3l1.4-1.4"],
  lua: ["M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"],
  cliente: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"],
} as const;

export type NomeIcone = keyof typeof ICONES;

/** Ícone de traço 2px, 24×24, na cor do texto. Sempre acompanha texto. */
export function Icone({ nome, tamanho = 24, className }: { nome: NomeIcone; tamanho?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cx("block flex-none", className)}
    >
      {ICONES[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
