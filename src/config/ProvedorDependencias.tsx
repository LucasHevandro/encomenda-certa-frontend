"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useState } from "react";
import { type Container, criarContainer } from "./container";

export const ContextoDependencias = createContext<Container | null>(null);

/** Cria o container e o cache do TanStack Query uma vez por aba do navegador. */
export function ProvedorDependencias({ children }: { children: ReactNode }) {
  const [container] = useState(criarContainer);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );

  return (
    <ContextoDependencias.Provider value={container}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ContextoDependencias.Provider>
  );
}
