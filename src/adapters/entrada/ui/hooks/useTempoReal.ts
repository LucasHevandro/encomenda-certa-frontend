"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import { chaves } from "./chaves";
import { useDependencias } from "./useCasosDeUso";

/**
 * Ouve os eventos do dia e recarrega o que está na tela.
 * Use uma vez, no layout de /dias/[diaId].
 */
export function useTempoReal(diaId: string, aoReceber?: (evento: EventoDoDia) => void) {
  const { eventos } = useDependencias();
  const queryClient = useQueryClient();

  useEffect(() => {
    return eventos.assinar(diaId, (evento) => {
      queryClient.invalidateQueries({ queryKey: chaves.dia(diaId) });
      aoReceber?.(evento);
    });
  }, [diaId, eventos, queryClient, aoReceber]);
}
