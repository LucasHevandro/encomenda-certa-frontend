import { criarAdaptadoresEmMemoria } from "@/adapters/saida/memoria";
import { MensageiroWhatsApp } from "@/adapters/saida/whatsapp/MensageiroWhatsApp";
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
import { RegistrarPagamento } from "@/core/application/casos-de-uso/pedidos/RegistrarPagamento";
import { SalvarProducao } from "@/core/application/casos-de-uso/producao/SalvarProducao";
import { GerenciarProdutos } from "@/core/application/casos-de-uso/produtos/GerenciarProdutos";

/**
 * Único lugar que sabe quais adaptadores estão em uso.
 * Quando a API existir, troque aqui cada gateway em memória pelo HTTP (um de cada vez).
 */
export function criarContainer() {
  const saida = criarAdaptadoresEmMemoria({ atrasoMs: 250 });
  const mensageiro = new MensageiroWhatsApp();

  return {
    eventos: saida.eventos,
    casos: {
      sessao: new Sessao(saida.sessao),
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
