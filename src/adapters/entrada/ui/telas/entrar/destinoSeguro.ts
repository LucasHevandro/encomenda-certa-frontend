const PADRAO = "/dias";

/**
 * Só aceita voltar para caminhos do próprio app. O navegador lê "/\site.com" e "/\t/site.com"
 * como "//site.com", então a conferência resolve o endereço de verdade em vez de olhar o texto.
 */
export function destinoSeguro(proximo: string | undefined): string {
  if (!proximo || !proximo.startsWith("/")) return PADRAO;
  const base = "http://app.invalido";
  try {
    const url = new URL(proximo, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : PADRAO;
  } catch {
    return PADRAO;
  }
}
