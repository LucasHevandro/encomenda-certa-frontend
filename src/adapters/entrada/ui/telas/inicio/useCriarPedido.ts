"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NovoPedido } from "@/core/application/portas/PedidosGateway";
import type { EstoqueDoProduto } from "@/core/domain/disponibilidade/Disponibilidade";
import { chaves } from "../../hooks/chaves";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

/**
 * Se der QuantidadeIndisponivel, `error` traz `maximo` para o aviso "Reservar N".
 * Mover para telas/novo-pedido/ quando essa tela for criada.
 */
export function useCriarPedido(estoquesNaTela?: readonly EstoqueDoProduto[]) {
  const { criarPedido } = useCasosDeUso();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comando: NovoPedido) => criarPedido.executar(comando, estoquesNaTela),
    onSuccess: (_pedido, comando) => queryClient.invalidateQueries({ queryKey: chaves.dia(comando.diaId) }),
  });
}
