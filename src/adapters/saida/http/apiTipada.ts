import { type ClienteApi, type Metodo, query } from "./cliente";
import type { components, paths } from "./schema";

/**
 * Chamadas à API com os tipos gerados do openapi.json do backend (`pnpm api:tipos`).
 * Se a API mudar uma rota ou um formato e os tipos forem gerados de novo, o TypeScript
 * aponta aqui, no build, o que deixou de bater.
 */

export type Esquema<Nome extends keyof components["schemas"]> = components["schemas"][Nome];

type Caminho = keyof paths;
type MetodoMinusculo = Lowercase<Metodo>;
type Operacao<C extends Caminho, M extends MetodoMinusculo> = paths[C][M];

type JsonDe<R> = R extends { content: { "application/json": infer T } } ? T : void;
type Sucesso<R> = R extends { 200: infer A } ? A : R extends { 201: infer B } ? B : R extends { 204: infer C } ? C : never;

export type Resposta<C extends Caminho, M extends MetodoMinusculo> = Operacao<C, M> extends { responses: infer R } ? JsonDe<Sucesso<R>> : never;
export type Corpo<C extends Caminho, M extends MetodoMinusculo> =
  Operacao<C, M> extends { requestBody: { content: { "application/json": infer B } } } ? B : undefined;

/** Métodos que existem para o caminho, segundo o contrato. */
type MetodosDe<C extends Caminho> = { [M in MetodoMinusculo]: Operacao<C, M> extends undefined | never ? never : M }[MetodoMinusculo];

interface Opcoes<C extends Caminho, M extends MetodoMinusculo> {
  /** Substitui {id} no caminho. */
  readonly id?: string;
  readonly query?: Record<string, string | undefined>;
  readonly corpo?: Corpo<C, M>;
}

export class ApiTipada {
  constructor(readonly cliente: ClienteApi) {}

  get baseUrl() {
    return this.cliente.baseUrl;
  }

  chamar<C extends Caminho, M extends MetodosDe<C>>(metodo: M, caminho: C, opcoes: Opcoes<C, M> = {}): Promise<Resposta<C, M>> {
    const url = `${(caminho as string).replace("{id}", encodeURIComponent(opcoes.id ?? ""))}${query(opcoes.query ?? {})}`;
    const corpo = opcoes.corpo ?? (metodo === "post" ? {} : undefined);
    return this.cliente.requisitar(metodo.toUpperCase() as Metodo, url, corpo);
  }
}
