"use client";

import { useQuery } from "@tanstack/react-query";
import type { FiltroPedidos } from "@/core/application/portas/PedidosGateway";
import { chaves } from "./chaves";
import { useCasosDeUso } from "./useCasosDeUso";

/** A tela pede ao caso de uso; o TanStack Query guarda em cache e controla o carregamento. */

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

export function useClientes() {
  const { clientes } = useCasosDeUso();
  return useQuery({ queryKey: chaves.clientes(), queryFn: () => clientes.listar() });
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
