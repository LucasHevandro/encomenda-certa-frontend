import { ClienteApi } from "@/adapters/saida/http/cliente";
import {
  ClientesHttp,
  DiasHttp,
  EsperaHttp,
  PedidosHttp,
  ProducaoHttp,
  ProdutosHttp,
  SessaoHttp,
  UsuariosHttp,
} from "@/adapters/saida/http/GatewaysHttp";
import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { EventosSSE } from "@/adapters/saida/tempo-real/EventosSSE";
import type { Usuario } from "@/core/application/portas/SessaoGateway";
import { COOKIE_SESSAO } from "./sessao";
import { MensageiroWhatsApp } from "@/adapters/saida/whatsapp/MensageiroWhatsApp";
import { GerenciarUsuarios } from "@/core/application/casos-de-uso/auth/GerenciarUsuarios";
import { Sessao } from "@/core/application/casos-de-uso/auth/Sessao";
import { BuscarClientes } from "@/core/application/casos-de-uso/clientes/BuscarClientes";
import { AbrirDiaVenda } from "@/core/application/casos-de-uso/dias/AbrirDiaVenda";
import { FecharDia } from "@/core/application/casos-de-uso/dias/FecharDia";
import { ListarDias } from "@/core/application/casos-de-uso/dias/ListarDias";
import { ObterFechamento } from "@/core/application/casos-de-uso/dias/ObterFechamento";
import { ObterPainel } from "@/core/application/casos-de-uso/dias/ObterPainel";
import { ListaDeEspera } from "@/core/application/casos-de-uso/espera/ListaDeEspera";
import { CancelarPedido } from "@/core/application/casos-de-uso/pedidos/CancelarPedido";
import { CriarPedido } from "@/core/application/casos-de-uso/pedidos/CriarPedido";
import { EditarPedido } from "@/core/application/casos-de-uso/pedidos/EditarPedido";
import { EnviarConfirmacao } from "@/core/application/casos-de-uso/pedidos/EnviarConfirmacao";
import { ListarPedidos } from "@/core/application/casos-de-uso/pedidos/ListarPedidos";
import { MarcarRetirado } from "@/core/application/casos-de-uso/pedidos/MarcarRetirado";
import { ObterPedido } from "@/core/application/casos-de-uso/pedidos/ObterPedido";
import { ReativarPedido } from "@/core/application/casos-de-uso/pedidos/ReativarPedido";
import { RegistrarPagamento } from "@/core/application/casos-de-uso/pedidos/RegistrarPagamento";
import { SalvarProducao } from "@/core/application/casos-de-uso/producao/SalvarProducao";
import { GerenciarProdutos } from "@/core/application/casos-de-uso/produtos/GerenciarProdutos";

/** Imita o cookie httpOnly que a API grava, para o proxy.ts deixar entrar também sem API. */
function gravarCookieDeSessao(usuario: Usuario | null) {
  if (typeof document === "undefined") return;
  const umAno = 60 * 60 * 24 * 365;
  document.cookie = usuario
    ? `${COOKIE_SESSAO}=memoria; path=/; max-age=${umAno}; samesite=lax`
    : `${COOKIE_SESSAO}=; path=/; max-age=0; samesite=lax`;
}

/**
 * Em desenvolvimento a API costuma estar em "localhost". Aberto no celular pelo IP do computador
 * (ex.: http://192.168.0.10:3000), "localhost" seria o próprio celular: troca pelo endereço da página.
 */
export function urlDaApi(configurada: string, paginaHost?: string): string {
  // Caminho relativo (/api): o próprio Next repassa para a API, nada a ajustar.
  if (configurada.startsWith("/")) return configurada.replace(/\/$/, "");
  const url = new URL(configurada);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (local && paginaHost && !["localhost", "127.0.0.1", "[::1]"].includes(paginaHost)) url.hostname = paginaHost;
  return url.toString().replace(/\/$/, "");
}

/** Com NEXT_PUBLIC_API_URL usa a API e o SSE; sem ela, os adaptadores em memória. */
function criarSaida() {
  const urlApi = process.env.NEXT_PUBLIC_API_URL;
  if (!urlApi) return criarAdaptadoresEmMemoria({ atrasoMs: 250, aoMudarSessao: gravarCookieDeSessao });
  const api = new ClienteApi(urlDaApi(urlApi, typeof window === "undefined" ? undefined : window.location.hostname));
  return {
    dias: new DiasHttp(api),
    pedidos: new PedidosHttp(api),
    producao: new ProducaoHttp(api),
    clientes: new ClientesHttp(api),
    produtos: new ProdutosHttp(api),
    espera: new EsperaHttp(api),
    sessao: new SessaoHttp(api),
    usuarios: new UsuariosHttp(api),
    eventos: new EventosSSE(api.baseUrl),
  };
}

/**
 * Único lugar que sabe quais adaptadores estão em uso.
 * Para ligar uma porta na API antes das outras, troque só ela aqui.
 */
export function criarContainer() {
  const saida = criarSaida();
  const mensageiro = new MensageiroWhatsApp();

  return {
    eventos: saida.eventos,
    casos: {
      sessao: new Sessao(saida.sessao),
      usuarios: new GerenciarUsuarios(saida.usuarios),
      listarDias: new ListarDias(saida.dias),
      abrirDia: new AbrirDiaVenda(saida.dias),
      obterPainel: new ObterPainel(saida.dias),
      fecharDia: new FecharDia(saida.dias),
      obterFechamento: new ObterFechamento(saida.dias, saida.pedidos),
      listarPedidos: new ListarPedidos(saida.pedidos),
      obterPedido: new ObterPedido(saida.pedidos),
      criarPedido: new CriarPedido(saida.pedidos),
      editarPedido: new EditarPedido(saida.pedidos),
      marcarRetirado: new MarcarRetirado(saida.pedidos),
      registrarPagamento: new RegistrarPagamento(saida.pedidos),
      cancelarPedido: new CancelarPedido(saida.pedidos),
      reativarPedido: new ReativarPedido(saida.pedidos),
      enviarConfirmacao: new EnviarConfirmacao(mensageiro),
      producao: new SalvarProducao(saida.producao),
      clientes: new BuscarClientes(saida.clientes),
      espera: new ListaDeEspera(saida.espera),
      produtos: new GerenciarProdutos(saida.produtos),
    },
  };
}

export type Container = ReturnType<typeof criarContainer>;
export type CasosDeUso = Container["casos"];
