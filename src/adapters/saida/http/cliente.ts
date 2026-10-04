import { converterErro } from "./erros";

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Cliente HTTP da API. O cookie de sessão vai junto (credentials: "include").
 * Quando a API publicar o OpenAPI, dá para trocar por openapi-fetch com os tipos gerados
 * sem mexer nos gateways: eles só usam `requisitar`.
 */
export class ClienteApi {
  constructor(
    readonly baseUrl: string,
    private readonly buscar: typeof fetch = (...args) => fetch(...args),
  ) {}

  async requisitar<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
    const resposta = await this.buscar(`${this.baseUrl}${caminho}`, {
      method: metodo,
      credentials: "include",
      headers: corpo === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    if (!resposta.ok) throw await converterErro(resposta);
    if (resposta.status === 204) return undefined as T;
    return (await resposta.json()) as T;
  }

  get<T>(caminho: string) {
    return this.requisitar<T>("GET", caminho);
  }
  post<T>(caminho: string, corpo?: unknown) {
    return this.requisitar<T>("POST", caminho, corpo ?? {});
  }
  put<T>(caminho: string, corpo: unknown) {
    return this.requisitar<T>("PUT", caminho, corpo);
  }
  patch<T>(caminho: string, corpo: unknown) {
    return this.requisitar<T>("PATCH", caminho, corpo);
  }
  delete<T>(caminho: string) {
    return this.requisitar<T>("DELETE", caminho);
  }
}

/** Monta a query string ignorando valores vazios. */
export function query(parametros: Record<string, string | undefined>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) if (valor) busca.set(chave, valor);
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}
