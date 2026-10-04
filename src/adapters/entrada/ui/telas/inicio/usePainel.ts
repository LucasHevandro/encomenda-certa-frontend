"use client";

import { useQuery } from "@tanstack/react-query";
import { chaves } from "../../hooks/chaves";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

/** Exemplo do padrão: a tela pede ao caso de uso, o TanStack Query guarda em cache. */
export function usePainel(diaId: string) {
  const { obterPainel } = useCasosDeUso();
  return useQuery({
    queryKey: chaves.painel(diaId),
    queryFn: () => obterPainel.executar(diaId),
  });
}
