import { ErroDeDominio } from "@/core/domain/compartilhado/ErroDeDominio";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { ProducaoAbaixoDoComprometido } from "@/core/domain/producao/Producao";

/**
 * Corpo de erro combinado com a API: { codigo, mensagem, ...detalhes }.
 * 409 quantidade-indisponivel traz produtoId, nome, solicitado e maximo (vira o "Reservar N").
 */
interface CorpoDeErro {
  codigo?: string;
  mensagem?: string;
  produtoId?: string;
  nome?: string;
  solicitado?: number;
  maximo?: number;
  novaProducao?: number;
  minimo?: number;
}

/** Resposta de erro da API → erro do domínio, para a tela tratar igual ao adaptador em memória. */
export async function converterErro(resposta: Response): Promise<Error> {
  let corpo: CorpoDeErro = {};
  try {
    corpo = (await resposta.json()) as CorpoDeErro;
  } catch {
    // Sem corpo JSON: fica só o status.
  }

  if (corpo.codigo === "quantidade-indisponivel" && corpo.produtoId && corpo.maximo != null) {
    return new QuantidadeIndisponivel(corpo.produtoId, corpo.nome ?? corpo.produtoId, corpo.solicitado ?? corpo.maximo + 1, corpo.maximo);
  }
  if (corpo.codigo === "producao-abaixo-do-comprometido" && corpo.produtoId && corpo.minimo != null) {
    return new ProducaoAbaixoDoComprometido(corpo.produtoId, corpo.novaProducao ?? 0, corpo.minimo);
  }
  if (resposta.status === 401) {
    return new ErroDeDominio("sessao-expirada", corpo.mensagem ?? "Sua sessão terminou. Entre de novo.");
  }
  if (corpo.codigo) {
    return new ErroDeDominio(corpo.codigo, corpo.mensagem ?? "Não foi possível concluir.");
  }
  if (resposta.status === 404) return new ErroDeDominio("nao-encontrado", "Não encontrado.");
  return new Error(`Erro ${resposta.status} da API.`);
}
