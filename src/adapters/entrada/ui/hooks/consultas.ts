"use client";

import { useQuery } from "@tanstack/react-query";
import { CONFIGURACAO_PADRAO, type Configuracao } from "@/core/domain/configuracao/Configuracao";
import type { FiltroPedidos } from "@/core/application/portas/PedidosGateway";
import { chaves } from "./chaves";
import { useCasosDeUso } from "./useCasosDeUso";

/** A tela pede ao caso de uso; o TanStack Query guarda em cache e controla o carregamento. */

/**
 * Configurações do estabelecimento. Enquanto não chegam (ou sem conexão), valem os padrões,
 * então as telas nunca esperam por elas.
 */
export function useConfiguracao(): Configuracao {
  const { configuracao } = useCasosDeUso();
  const { data } = useQuery({ queryKey: chaves.configuracao(), queryFn: () => configuracao.obter(), staleTime: 5 * 60_000 });
  return data ?? CONFIGURACAO_PADRAO;
}

export function usePainel(diaId: string) {
  const { obterPainel } = useCasosDeUso();
  return useQuery({ queryKey: chaves.painel(diaId), queryFn: () => obterPainel.executar(diaId) });
}

export function usePedidos(diaId: string, filtro: FiltroPedidos = {}) {
  const { listarPedidos } = useCasosDeUso();
  return useQuery({
    queryKey: chaves.pedidos(diaId, filtro),
    queryFn: () => listarPedidos.executar(diaId, filtro),
    placeholderData: (anterior) => anterior,
  });
}

export function usePedido(diaId: string, pedidoId: string) {
  const { obterPedido } = useCasosDeUso();
  return useQuery({ queryKey: chaves.pedido(diaId, pedidoId), queryFn: () => obterPedido.executar(pedidoId) });
}

export function useProdutos() {
  const { produtos } = useCasosDeUso();
  return useQuery({ queryKey: chaves.produtos(), queryFn: () => produtos.listar() });
}

export function useProducao(diaId: string) {
  const { producao } = useCasosDeUso();
  return useQuery({ queryKey: chaves.producao(diaId), queryFn: () => producao.obter(diaId) });
}

export function useHistoricoProducao(diaId: string) {
  const { producao } = useCasosDeUso();
  return useQuery({ queryKey: chaves.historicoProducao(diaId), queryFn: () => producao.historico(diaId) });
}

export function useEspera(diaId: string) {
  const { espera } = useCasosDeUso();
  return useQuery({ queryKey: chaves.espera(diaId), queryFn: () => espera.listar(diaId) });
}

export function useFechamento(diaId: string) {
  const { obterFechamento } = useCasosDeUso();
  return useQuery({ queryKey: chaves.fechamento(diaId), queryFn: () => obterFechamento.executar(diaId) });
}

export function useDias() {
  const { listarDias } = useCasosDeUso();
  return useQuery({ queryKey: chaves.dias(), queryFn: () => listarDias.executar() });
}

export function useRelatorio(dias: number) {
  const { relatorio } = useCasosDeUso();
  return useQuery({ queryKey: chaves.relatorio(dias), queryFn: () => relatorio.executar(dias), placeholderData: (anterior) => anterior });
}

export function useUsuarios() {
  const { usuarios } = useCasosDeUso();
  return useQuery({ queryKey: chaves.usuarios(), queryFn: () => usuarios.listar() });
}

export function useClientes() {
  const { clientes } = useCasosDeUso();
  return useQuery({ queryKey: chaves.clientes(), queryFn: () => clientes.listar() });
}

export function useHistoricoCliente(clienteId: string) {
  const { clientes } = useCasosDeUso();
  return useQuery({ queryKey: chaves.cliente(clienteId), queryFn: () => clientes.historico(clienteId) });
}

/** Procura o cliente assim que o telefone tem DDD + número. */
export function useClientePorTelefone(telefone: string) {
  const { clientes } = useCasosDeUso();
  const digitos = telefone.replace(/\D/g, "");
  return useQuery({
    queryKey: chaves.clientePorTelefone(digitos),
    queryFn: () => clientes.porTelefone(digitos),
    enabled: digitos.length >= 10,
    staleTime: 60_000,
  });
}
