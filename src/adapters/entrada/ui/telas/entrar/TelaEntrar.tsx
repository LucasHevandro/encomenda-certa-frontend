"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Aviso, Botao, BotaoTema, Campo } from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { useConexao } from "../../hooks/useConexao";
import { NomeDoEstabelecimento } from "../geral/Marca";

/** Só aceita voltar para caminhos do próprio app. */
function destinoSeguro(proximo: string | undefined): string {
  return proximo && proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : "/dias";
}

/** Login por pessoa, com sessão longa para não pedir senha no meio do domingo. */
/** Avisos de quem foi mandado de volta para o login. */
const AVISOS: Record<string, string> = {
  "empresa-inativa": "O acesso deste estabelecimento foi desativado. Fale com o suporte.",
};

export function TelaEntrar({ proximo, aviso }: { proximo?: string; aviso?: string }) {
  const router = useRouter();
  const online = useConexao();
  const queryClient = useQueryClient();
  const { sessao } = useCasosDeUso();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const entrar = useMutation({
    mutationFn: () => sessao.entrar(email, senha),
    onSuccess: (usuario) => {
      queryClient.clear();
      // O administrador do sistema não pertence a nenhuma empresa: vai direto para o painel.
      router.replace(usuario.administrador ? "/admin" : destinoSeguro(proximo));
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    entrar.mutate();
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-coluna flex-col justify-center gap-8 px-4 py-10">
      <BotaoTema className="absolute top-2 right-1" />
      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-display">
          <NomeDoEstabelecimento />
        </h1>
        <p className="m-0 text-ink-muted">Pedidos e produção, num lugar só.</p>
      </header>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo rotulo="E-mail" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {entrar.isError && <Aviso tom="critico">{mensagemDeErro(entrar.error)}</Aviso>}
        {!entrar.isError && aviso && AVISOS[aviso] && <Aviso tom="alerta">{AVISOS[aviso]}</Aviso>}
        {!online && <Aviso tom="alerta">Sem conexão. Confira a internet para entrar.</Aviso>}
        <Botao type="submit" bloco disabled={entrar.isPending || !online}>
          {entrar.isPending ? "Entrando…" : "Entrar"}
        </Botao>
      </form>
    </main>
  );
}
