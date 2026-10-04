import type { ReactNode } from "react";
import { Aviso } from "./Aviso";
import { Botao } from "./Botao";

/** Placeholder enquanto os dados chegam. */
export function Carregando({ linhas = 3 }: { linhas?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-3">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-surface-sunken" />
      ))}
    </div>
  );
}

/** Erro de carregamento com saída: tentar de novo. */
export function FalhaAoCarregar({ erro, aoTentarDeNovo }: { erro: unknown; aoTentarDeNovo?: () => void }) {
  return (
    <Aviso
      tom="critico"
      titulo="Não foi possível carregar"
      acoes={
        aoTentarDeNovo && (
          <Botao variante="secundario" tamanho="md" onClick={aoTentarDeNovo}>
            Tentar de novo
          </Botao>
        )
      }
    >
      {erro instanceof Error ? erro.message : "Confira a conexão e tente de novo."}
    </Aviso>
  );
}

/** Lista vazia: uma frase e, se fizer sentido, a próxima ação. */
export function Vazio({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-ink-muted">
      <p className="m-0">{children}</p>
      {acao}
    </div>
  );
}

/** Coluna de conteúdo das telas: 480px no celular, mais larga quando a tela pede. */
export function Pagina({ children, larga }: { children: ReactNode; larga?: boolean }) {
  return (
    <main className={`mx-auto flex w-full flex-col gap-6 px-4 pb-8 tablet:px-6 ${larga ? "max-w-5xl" : "max-w-coluna tablet:max-w-2xl"}`}>
      {children}
    </main>
  );
}

/** Título de seção dentro de uma tela. */
export function Secao({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 font-display text-titulo">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}
