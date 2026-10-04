import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSAO, ROTA_ENTRAR } from "./config/sessao";

/**
 * Sem cookie de sessão → /entrar, guardando para onde a pessoa ia.
 * Só confere se o cookie existe; quem valida a sessão de verdade é a API (401 → sessão expirada).
 */
export function proxy(request: NextRequest) {
  const logado = request.cookies.has(COOKIE_SESSAO);
  const { pathname, search } = request.nextUrl;

  // /entrar fica sempre aberta: um cookie vencido não pode prender a pessoa num redirecionamento.
  if (pathname === ROTA_ENTRAR) return NextResponse.next();
  if (!logado) {
    const destino = new URL(ROTA_ENTRAR, request.url);
    if (pathname !== "/") destino.searchParams.set("proximo", `${pathname}${search}`);
    return NextResponse.redirect(destino);
  }
  return NextResponse.next();
}

export const config = {
  // Fora: arquivos do Next, service worker, manifesto, ícones e a página offline.
  matcher: ["/((?!_next/|serwist/|manifest.webmanifest|icon|apple-icon|favicon.ico|offline).*)"],
};
