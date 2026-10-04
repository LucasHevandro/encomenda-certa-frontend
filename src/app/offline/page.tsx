import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão · Expresso Café" };

/** Mostrada pelo service worker quando não há internet. O app não funciona offline. */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-coluna flex-col justify-center gap-3 px-4 text-center">
      <h1 className="m-0 font-display text-display">Sem conexão</h1>
      <p className="m-0 text-ink-muted">
        O Expresso café precisa de internet para mostrar a disponibilidade certa e não vender o mesmo frango duas vezes. Confira a
        conexão e tente de novo.
      </p>
    </main>
  );
}
