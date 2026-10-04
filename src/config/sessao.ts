/**
 * Nome do cookie de sessão que o proxy.ts confere. A API grava com esse nome
 * (httpOnly, Domain=.seudominio.com); sem API, o container grava um igual ao entrar.
 */
export const COOKIE_SESSAO = process.env.NEXT_PUBLIC_COOKIE_SESSAO || "expresso_sessao";

/** Rotas abertas sem login. */
export const ROTA_ENTRAR = "/entrar";
