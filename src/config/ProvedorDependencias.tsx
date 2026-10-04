"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useState } from "react";
import { ErroDeDominio } from "@/core/domain/compartilhado/ErroDeDominio";
import { type Container, criarContainer } from "./container";
import { ROTA_ENTRAR } from "./sessao";

export const ContextoDependencias = createContext<Container | null>(null);

/** Erro de regra não adianta repetir; falha de rede tenta mais uma vez. */
const tentarDeNovo = (tentativas: number, erro: unknown) => !(erro instanceof ErroDeDominio) && tentativas < 1;

/** Cria o container e o cache do TanStack Query uma vez por aba do navegador. */
export function ProvedorDependencias({ children }: { children: ReactNode }) {
  const [container] = useState(criarContainer);
  const [queryClient] = useState(() => {
    // Sessão vencida em qualquer chamada: limpa o cookie e volta para o login.
    const aoErrar = (erro: unknown) => {
      if (erro instanceof ErroDeDominio && erro.codigo === "sessao-expirada" && window.location.pathname !== ROTA_ENTRAR) {
        container.casos.sessao.sair().finally(() => {
          // Recarrega de propósito: limpa o cache de todos os dados da sessão vencida.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = `${ROTA_ENTRAR}?proximo=${encodeURIComponent(window.location.pathname)}`;
        });
      }
    };
    return new QueryClient({
      queryCache: new QueryCache({ onError: aoErrar }),
      mutationCache: new MutationCache({ onError: aoErrar }),
      defaultOptions: { queries: { staleTime: 30_000, retry: tentarDeNovo } },
    });
  });

  return (
    <ContextoDependencias.Provider value={container}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ContextoDependencias.Provider>
  );
}
