import { describe, expect, it } from "vitest";
import { ClienteApi } from "@/adapters/saida/http/cliente";
import { PedidosHttp, SessaoHttp } from "@/adapters/saida/http/GatewaysHttp";
import { EventosSSE } from "@/adapters/saida/tempo-real/EventosSSE";
import type { EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import { ErroDeDominio } from "@/core/domain/compartilhado/ErroDeDominio";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";

type Chamada = { url: string; init?: RequestInit };

function apiFalsa(status: number, corpo: unknown) {
  const chamadas: Chamada[] = [];
  const buscar = (async (url: string, init?: RequestInit) => {
    chamadas.push({ url, init });
    return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return { api: new ClienteApi("https://api.teste", buscar), chamadas };
}

describe("PedidosHttp", () => {
  it("cria o pedido no dia certo, com cookie, e converte o dinheiro", async () => {
    const pedido = {
      id: "p1",
      numero: 260,
      diaId: "2026-10-04",
      cliente: { nome: "Ana" },
      itens: [{ produtoId: "frango", nome: "Frango", quantidade: 2, precoUnitario: 5500 }],
      retirada: "reservado",
      pagamento: "pendente",
    };
    const { api, chamadas } = apiFalsa(201, pedido);
    const criado = await new PedidosHttp(api).criar({ diaId: "2026-10-04", cliente: { nome: "Ana" }, itens: [{ produtoId: "frango", quantidade: 2 }] });
    expect(criado.itens[0].precoUnitario).toBe(5500);
    expect(chamadas[0].url).toBe("https://api.teste/dias/2026-10-04/pedidos");
    expect(chamadas[0].init?.method).toBe("POST");
    expect(chamadas[0].init?.credentials).toBe("include");
    expect(JSON.parse(String(chamadas[0].init?.body))).toEqual({ cliente: { nome: "Ana" }, itens: [{ produtoId: "frango", quantidade: 2 }] });
  });

  it("409 vira QuantidadeIndisponivel com o máximo para o Reservar N", async () => {
    const { api } = apiFalsa(409, { codigo: "quantidade-indisponivel", mensagem: "x", produtoId: "frango", nome: "Frango", solicitado: 6, maximo: 5 });
    const erro = await new PedidosHttp(api).criar({ diaId: "d", cliente: { nome: "Ana" }, itens: [] }).catch((e) => e);
    expect(erro).toBeInstanceOf(QuantidadeIndisponivel);
    expect(erro).toMatchObject({ maximo: 5, solicitado: 6, produtoId: "frango" });
  });

  it("monta a busca na query string", async () => {
    const { api, chamadas } = apiFalsa(200, []);
    await new PedidosHttp(api).listar("2026-10-04", { retirada: "reservado", busca: "joão" });
    expect(chamadas[0].url).toBe("https://api.teste/dias/2026-10-04/pedidos?retirada=reservado&busca=jo%C3%A3o");
  });

  it("422 com código vira ErroDeDominio com a mensagem do balcão; 401 vira sessão expirada", async () => {
    const regra = apiFalsa(422, { codigo: "dia-encerrado", mensagem: "Este dia já foi fechado." });
    await expect(new PedidosHttp(regra.api).marcarRetirado("p1")).rejects.toMatchObject({ codigo: "dia-encerrado", message: "Este dia já foi fechado." });
    const semSessao = apiFalsa(401, undefined);
    const erro = await new PedidosHttp(semSessao.api).obter("p1").catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDeDominio);
    expect(erro.codigo).toBe("sessao-expirada");
  });
});

describe("SessaoHttp", () => {
  it("sem sessão, atual() devolve null", async () => {
    const { api } = apiFalsa(401, undefined);
    expect(await new SessaoHttp(api).atual()).toBeNull();
  });
});

describe("EventosSSE", () => {
  it("assina /dias/:id/eventos, traduz os eventos e fecha ao sair", () => {
    const ouvintes = new Map<string, (e: MessageEvent<string>) => void>();
    let aberta = "";
    let fechada = false;
    const sse = new EventosSSE("https://api.teste", (url) => {
      aberta = url;
      return {
        addEventListener: ((tipo: string, ouvinte: (e: MessageEvent<string>) => void) => ouvintes.set(tipo, ouvinte)) as EventSource["addEventListener"],
        close: () => {
          fechada = true;
        },
      };
    });
    const recebidos: EventoDoDia[] = [];
    const parar = sse.assinar("2026-10-04", (e) => recebidos.push(e));
    ouvintes.get("unidades-liberadas")!({ data: JSON.stringify({ produtoId: "pernil", quantidade: 2 }) } as MessageEvent<string>);
    ouvintes.get("open")!({} as MessageEvent<string>);
    ouvintes.get("open")!({} as MessageEvent<string>); // reconectou: recarrega
    parar();
    expect(aberta).toBe("https://api.teste/dias/2026-10-04/eventos");
    expect(recebidos).toEqual([{ tipo: "unidades-liberadas", produtoId: "pernil", quantidade: 2 }, { tipo: "disponibilidade-mudou" }]);
    expect(fechada).toBe(true);
  });
});
