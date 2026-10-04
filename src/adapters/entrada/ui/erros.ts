import { ErroDeDominio } from "@/core/domain/compartilhado/ErroDeDominio";

/** Frase para a pessoa no balcão. Erro de regra já vem escrito; o resto vira uma frase genérica. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroDeDominio) return erro.message;
  if (typeof navigator !== "undefined" && !navigator.onLine) return "Sem conexão. Confira a internet e tente de novo.";
  return "Algo deu errado. Tente de novo.";
}

export function codigoDoErro(erro: unknown): string | undefined {
  return erro instanceof ErroDeDominio ? erro.codigo : undefined;
}
