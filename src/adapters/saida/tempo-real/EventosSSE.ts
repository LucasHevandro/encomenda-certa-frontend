import type { EventoDoDia, EventosTempoReal } from "@/core/application/portas/EventosTempoReal";

type CriarFonte = (url: string) => Pick<EventSource, "addEventListener" | "close">;

/**
 * Eventos do dia por Server-Sent Events (GET /dias/:id/eventos).
 * O EventSource reconecta sozinho; ao reconectar, avisamos "disponibilidade-mudou"
 * para a tela recarregar o que pode ter perdido enquanto estava sem conexão.
 */
export class EventosSSE implements EventosTempoReal {
  constructor(
    private readonly baseUrl: string,
    private readonly criarFonte: CriarFonte = (url) => new EventSource(url, { withCredentials: true }),
  ) {}

  assinar(diaId: string, aoReceber: (evento: EventoDoDia) => void): () => void {
    const fonte = this.criarFonte(`${this.baseUrl}/dias/${encodeURIComponent(diaId)}/eventos`);
    let jaAbriu = false;

    fonte.addEventListener("open", () => {
      if (jaAbriu) aoReceber({ tipo: "disponibilidade-mudou" });
      jaAbriu = true;
    });
    fonte.addEventListener("disponibilidade-mudou", () => aoReceber({ tipo: "disponibilidade-mudou" }));
    fonte.addEventListener("unidades-liberadas", (mensagem) => {
      try {
        const dados = JSON.parse((mensagem as MessageEvent<string>).data) as { produtoId: string; quantidade: number };
        aoReceber({ tipo: "unidades-liberadas", produtoId: dados.produtoId, quantidade: dados.quantidade });
      } catch {
        aoReceber({ tipo: "disponibilidade-mudou" });
      }
    });

    return () => fonte.close();
  }
}
