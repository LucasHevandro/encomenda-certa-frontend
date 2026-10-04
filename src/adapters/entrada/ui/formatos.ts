import type { Dinheiro } from "@/core/domain/compartilhado/Dinheiro";

/** Formatos do balcão: R$ 199,90 · Domingo, 04/10 · 04 de outubro · #0258. */

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reaisSemCentavos = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Espaço comum no lugar do não separável, para o texto ir igual para o WhatsApp. */
const espacoComum = (texto: string) => texto.replace(/ /g, " ");

/** "R$ 157,00". */
export function dinheiro(valor: Dinheiro): string {
  return espacoComum(reais.format(valor / 100));
}

/** "R$ 2.340" para números do resumo; mantém os centavos quando existem. */
export function dinheiroCurto(valor: Dinheiro): string {
  return valor % 100 === 0 ? espacoComum(reaisSemCentavos.format(valor / 100)) : dinheiro(valor);
}

/** "#0258". */
export function numeroPedido(numero: number): string {
  return `#${String(numero).padStart(4, "0")}`;
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Lê "2026-10-04" como data local, sem o deslocamento de fuso do `new Date(iso)`. */
export function lerData(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** "2026-10-04" de uma data local. */
export function dataIso(data: Date): string {
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** "Domingo". */
export function diaDaSemana(iso: string): string {
  return DIAS_SEMANA[lerData(iso).getDay()];
}

/** "Domingo, 04/10", para listas. */
export function dataCurta(iso: string): string {
  const data = lerData(iso);
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${DIAS_SEMANA[data.getDay()]}, ${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
}

/** "04 de outubro", para títulos. */
export function dataLonga(iso: string): string {
  const data = lerData(iso);
  return `${String(data.getDate()).padStart(2, "0")} de ${MESES[data.getMonth()]}`;
}

/** "27/09/2026", para o histórico. */
export function dataCompleta(iso: string): string {
  const data = lerData(iso);
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`;
}

/** "14:32", para o histórico de alterações. */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "1 frango" / "3 frangos": quantidade com a palavra, no singular ou no plural. */
export function quantidadeDe(quantidade: number, nome: string): string {
  return `${quantidade} ${quantidade === 1 ? nome : plural(nome)}`;
}

/** Plural simples do português para nomes de produtos ("Frango assado" → "Frangos assados"). */
export function plural(nome: string): string {
  return nome
    .split(" ")
    .map((palavra) => {
      if (/^(de|da|do|com|e)$/i.test(palavra)) return palavra;
      if (/[aeiouáéó]$/i.test(palavra)) return `${palavra}s`;
      if (/ão$/i.test(palavra)) return palavra.replace(/ão$/i, "ões");
      if (/[rsz]$/i.test(palavra)) return `${palavra}es`;
      if (/il$/i.test(palavra)) return palavra.replace(/il$/i, "is");
      if (/l$/i.test(palavra)) return palavra.replace(/l$/i, "is");
      return palavra;
    })
    .join(" ");
}

/** "(44) 99999-9999". */
export function telefone(digitos: string | undefined): string {
  if (!digitos) return "";
  const d = digitos.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
