"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NovaEntradaEspera } from "@/core/application/casos-de-uso/espera/ListaDeEspera";
import type { NovaProducao } from "@/core/application/casos-de-uso/producao/SalvarProducao";
import type { AbrirDia } from "@/core/application/portas/DiasGateway";
import type { NovoPedido } from "@/core/application/portas/PedidosGateway";
import type { Dinheiro } from "@/core/domain/compartilhado/Dinheiro";
import type { EstoqueDoProduto, ItemSolicitado } from "@/core/domain/disponibilidade/Disponibilidade";
import type { Pagamento, Pedido } from "@/core/domain/pedido/Pedido";
import { chaves } from "./chaves";
import { useCasosDeUso } from "./useCasosDeUso";

/** Depois de qualquer escrita, recarrega tudo do dia e a lista de dias. */
function useRecarregarDia() {
  const queryClient = useQueryClient();
  return (diaId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chaves.dia(diaId) }),
      queryClient.invalidateQueries({ queryKey: chaves.dias() }),
    ]);
}

/** Se der QuantidadeIndisponivel, `error` traz `maximo` para o aviso "Reservar N". */
export function useCriarPedido(estoquesNaTela?: readonly EstoqueDoProduto[]) {
  const { criarPedido } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comando: NovoPedido) => criarPedido.executar(comando, estoquesNaTela),
    onSuccess: (_pedido, comando) => {
      queryClient.invalidateQueries({ queryKey: chaves.clientes() });
      return recarregar(comando.diaId);
    },
  });
}

export function useEditarPedido(pedido: Pedido | undefined, estoquesNaTela?: readonly EstoqueDoProduto[]) {
  const { editarPedido } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({
    mutationFn: (itens: readonly ItemSolicitado[]) => editarPedido.executar(pedido!, itens, estoquesNaTela),
    onSuccess: (salvo) => recarregar(salvo.diaId),
  });
}

export function useMarcarRetirado(diaId: string) {
  const { marcarRetirado } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({ mutationFn: (pedidoId: string) => marcarRetirado.executar(pedidoId), onSuccess: () => recarregar(diaId) });
}

export function useRegistrarPagamento(diaId: string) {
  const { registrarPagamento } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({
    mutationFn: ({ pedidoId, pagamento }: { pedidoId: string; pagamento: Pagamento }) => registrarPagamento.executar(pedidoId, pagamento),
    onSuccess: () => recarregar(diaId),
  });
}

export function useCancelarPedido(diaId: string) {
  const { cancelarPedido } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({ mutationFn: (pedidoId: string) => cancelarPedido.executar(pedidoId), onSuccess: () => recarregar(diaId) });
}

export function useSalvarProducao(diaId: string) {
  const { producao } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({
    mutationFn: ({ novas, estoques }: { novas: readonly NovaProducao[]; estoques: readonly EstoqueDoProduto[] }) =>
      producao.executar(diaId, novas, estoques),
    onSuccess: () => recarregar(diaId),
  });
}

export function useAdicionarNaEspera() {
  const { espera } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({ mutationFn: (entrada: NovaEntradaEspera) => espera.adicionar(entrada), onSuccess: (e) => recarregar(e.diaId) });
}

export function useMudarEspera(diaId: string) {
  const { espera } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({
    mutationFn: ({ entradaId, status }: { entradaId: string; status: "atendido" | "desistiu" }) =>
      status === "atendido" ? espera.marcarAtendido(entradaId) : espera.marcarDesistiu(entradaId),
    onSuccess: () => recarregar(diaId),
  });
}

export function useAbrirDia(existentes: readonly string[]) {
  const { abrirDia } = useCasosDeUso();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comando: AbrirDia) => abrirDia.executar(comando, existentes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.dias() }),
  });
}

export function useFecharDia(diaId: string) {
  const { fecharDia } = useCasosDeUso();
  const recarregar = useRecarregarDia();
  return useMutation({ mutationFn: () => fecharDia.executar(diaId), onSuccess: () => recarregar(diaId) });
}

export function useSalvarProduto() {
  const { produtos } = useCasosDeUso();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (acao: { tipo: "criar"; nome: string; preco: Dinheiro } | { tipo: "preco"; produtoId: string; preco: Dinheiro } | { tipo: "ativo"; produtoId: string; ativo: boolean }) => {
      if (acao.tipo === "criar") return produtos.criar(acao.nome, acao.preco);
      if (acao.tipo === "preco") return produtos.mudarPreco(acao.produtoId, acao.preco);
      return produtos.ativar(acao.produtoId, acao.ativo);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.produtos() }),
  });
}
