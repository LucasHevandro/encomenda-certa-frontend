import Link from "next/link";
import type { ComponentProps } from "react";
import { classesBotao, type EstiloBotao } from "./Botao";
import { Icone, type NomeIcone } from "./Icone";

/** Link de navegação com a aparência do Botao ("Ver pedido", "Novo pedido"). */
export function LinkBotao({
  variante = "secundario",
  tamanho = "lg",
  bloco,
  icone,
  className,
  children,
  ...resto
}: ComponentProps<typeof Link> & EstiloBotao & { icone?: NomeIcone }) {
  return (
    <Link {...resto} className={classesBotao({ variante, tamanho, bloco }, className)}>
      {icone && <Icone nome={icone} tamanho={tamanho === "lg" ? 22 : 20} />}
      <span>{children}</span>
    </Link>
  );
}
