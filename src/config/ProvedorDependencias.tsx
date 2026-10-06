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
    // Sessão vencida ou empresa desativada: limpa o cookie e volta para o login.
    // Administrador numa tela de empresa (ou o contrário): vai para o lugar certo.
    // Recarrega de propósito: limpa o cache de todos os dados da sessão.
    /* eslint-disable @next/next/no-location-assign-relative-destination */
    const aoErrar = (erro: unknown) => {
      if (!(erro instanceof ErroDeDominio) || window.location.pathname === ROTA_ENTRAR) return;
      if (erro.codigo === "sessao-expirada") {
        container.casos.sessao.sair().finally(() => {
          window.location.href = `${ROTA_ENTRAR}?proximo=${encodeURIComponent(window.location.pathname)}`;
        });
      } else if (erro.codigo === "empresa-inativa") {
        container.casos.sessao.sair().finally(() => {
          window.location.href = `${ROTA_ENTRAR}?aviso=empresa-inativa`;
        });
      } else if (erro.codigo === "so-empresa") {
        window.location.href = "/admin";
      } else if (erro.codigo === "so-administrador") {
        window.location.href = "/dias";
      }
    };
    /* eslint-enable @next/next/no-location-assign-relative-destination */
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
