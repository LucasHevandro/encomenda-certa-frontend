"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Aviso, Botao, Campo } from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { useConexao } from "../../hooks/useConexao";

/** Só aceita voltar para caminhos do próprio app. */
function destinoSeguro(proximo: string | undefined): string {
  return proximo && proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : "/dias";
}

/** Login por pessoa, com sessão longa para não pedir senha no meio do domingo. */
export function TelaEntrar({ proximo }: { proximo?: string }) {
  const router = useRouter();
  const online = useConexao();
  const queryClient = useQueryClient();
  const { sessao } = useCasosDeUso();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const entrar = useMutation({
    mutationFn: () => sessao.entrar(email, senha),
    onSuccess: () => {
      queryClient.clear();
      router.replace(destinoSeguro(proximo));
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    entrar.mutate();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-coluna flex-col justify-center gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-display">Expresso café</h1>
        <p className="m-0 text-ink-muted">Pedidos e produção dos assados, num lugar só.</p>
      </header>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo rotulo="E-mail" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {entrar.isError && <Aviso tom="critico">{mensagemDeErro(entrar.error)}</Aviso>}
        {!online && <Aviso tom="alerta">Sem conexão. Confira a internet para entrar.</Aviso>}
        <Botao type="submit" bloco disabled={entrar.isPending || !online}>
          {entrar.isPending ? "Entrando…" : "Entrar"}
        </Botao>
      </form>
    </main>
  );
}
