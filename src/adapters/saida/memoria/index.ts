import type { Usuario } from "@/core/application/portas/SessaoGateway";
import { BancoEmMemoria } from "./BancoEmMemoria";
import { popularDadosIniciais } from "./dadosIniciais";
import {
  ClientesEmMemoria,
  ConfiguracaoEmMemoria,
  DiasEmMemoria,
  EsperaEmMemoria,
  EventosEmMemoria,
  MensageiroEmMemoria,
  PedidosEmMemoria,
  ProducaoEmMemoria,
  ProdutosEmMemoria,
  SessaoEmMemoria,
  UsuariosEmMemoria,
} from "./GatewaysEmMemoria";

/** Todos os adaptadores em memória, ligados ao mesmo banco falso. */
export function criarAdaptadoresEmMemoria({
  atrasoMs = 0,
  comDados = true,
  aoMudarSessao,
}: { atrasoMs?: number; comDados?: boolean; aoMudarSessao?: (usuario: Usuario | null) => void } = {}) {
  const banco = new BancoEmMemoria(atrasoMs);
  if (comDados) popularDadosIniciais(banco);
  return {
    banco,
    dias: new DiasEmMemoria(banco),
    pedidos: new PedidosEmMemoria(banco),
    producao: new ProducaoEmMemoria(banco),
    clientes: new ClientesEmMemoria(banco),
    produtos: new ProdutosEmMemoria(banco),
    espera: new EsperaEmMemoria(banco),
    sessao: new SessaoEmMemoria(banco, aoMudarSessao),
    usuarios: new UsuariosEmMemoria(banco),
    configuracao: new ConfiguracaoEmMemoria(banco),
    eventos: new EventosEmMemoria(banco),
    mensageiro: new MensageiroEmMemoria(),
  };
}

export type AdaptadoresEmMemoria = ReturnType<typeof criarAdaptadoresEmMemoria>;
