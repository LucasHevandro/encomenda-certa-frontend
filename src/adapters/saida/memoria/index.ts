import type { Usuario } from "@/core/application/portas/SessaoGateway";
import { BancoEmMemoria } from "./BancoEmMemoria";
import { popularDadosIniciais } from "./dadosIniciais";
import {
  ClientesEmMemoria,
  ConfiguracaoEmMemoria,
  DiasEmMemoria,
  EmpresasEmMemoria,
  EsperaEmMemoria,
  EventosEmMemoria,
  LojaEmMemoria,
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
  const pedidos = new PedidosEmMemoria(banco);
  const espera = new EsperaEmMemoria(banco);
  return {
    banco,
    dias: new DiasEmMemoria(banco),
    pedidos,
    producao: new ProducaoEmMemoria(banco),
    clientes: new ClientesEmMemoria(banco),
    produtos: new ProdutosEmMemoria(banco),
    espera,
    loja: new LojaEmMemoria(banco, pedidos, espera),
    sessao: new SessaoEmMemoria(banco, aoMudarSessao),
    usuarios: new UsuariosEmMemoria(banco),
    empresas: new EmpresasEmMemoria(banco),
    configuracao: new ConfiguracaoEmMemoria(banco),
    eventos: new EventosEmMemoria(banco),
    mensageiro: new MensageiroEmMemoria(),
  };
}

export type AdaptadoresEmMemoria = ReturnType<typeof criarAdaptadoresEmMemoria>;
