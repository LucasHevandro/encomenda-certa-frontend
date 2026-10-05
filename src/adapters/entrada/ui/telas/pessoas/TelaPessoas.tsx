"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { SENHA_MINIMA } from "@/core/application/casos-de-uso/auth/GerenciarUsuarios";
import { Aviso, Botao, Campo, Cartao, Carregando, FalhaAoCarregar, GrupoLista, ItemLista, Pagina, Secao } from "../../componentes";
import { codigoDoErro, mensagemDeErro } from "../../erros";
import { useCriarUsuario, useMudarSenha } from "../../hooks/acoes";
import { chaves } from "../../hooks/chaves";
import { useUsuarios } from "../../hooks/consultas";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

/** Quem tem acesso ao app. Um login por pessoa, todas com as mesmas permissões. */
export function TelaPessoas() {
  const usuarios = useUsuarios();
  const { sessao } = useCasosDeUso();
  const eu = useQuery({ queryKey: chaves.sessao(), queryFn: () => sessao.atual() });

  return (
    <Pagina>
      <header className="pt-6">
        <h1 className="m-0 font-display text-display">Pessoas</h1>
        <p className="m-0 mt-1 text-ink-muted">Cada pessoa entra com o próprio e-mail. Pedidos, retiradas e cancelamentos guardam quem fez.</p>
      </header>

      <Secao titulo="Com acesso">
        {usuarios.isPending ? (
          <Carregando linhas={2} />
        ) : usuarios.isError ? (
          <FalhaAoCarregar erro={usuarios.error} aoTentarDeNovo={() => usuarios.refetch()} />
        ) : (
          <GrupoLista>
            {usuarios.data.map((u) => (
              <ItemLista key={u.id} icone="cliente" titulo={u.nome} subtitulo={u.email} direita={u.id === eu.data?.id ? "Você" : undefined} />
            ))}
          </GrupoLista>
        )}
      </Secao>

      <NovaPessoa />
      <TrocarSenha />
    </Pagina>
  );
}

function NovaPessoa() {
  const criar = useCriarUsuario();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [criada, setCriada] = useState<string | null>(null);
  const codigo = codigoDoErro(criar.error);

  function enviar(e: FormEvent) {
    e.preventDefault();
    setCriada(null);
    criar.mutate(
      { nome, email, senha },
      {
        onSuccess: (usuario) => {
          setCriada(`${usuario.nome} já pode entrar com ${usuario.email}.`);
          setNome("");
          setEmail("");
          setSenha("");
        },
      },
    );
  }

  return (
    <Secao titulo="Dar acesso a alguém">
      <Cartao>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" erro={codigo === "usuario-sem-nome" ? mensagemDeErro(criar.error) : undefined} />
          <Campo
            rotulo="E-mail"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={codigo === "email-invalido" || codigo === "email-ja-existe" ? mensagemDeErro(criar.error) : undefined}
          />
          <Campo
            rotulo="Senha inicial"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            dica={`Pelo menos ${SENHA_MINIMA} caracteres. A pessoa pode trocar depois.`}
            erro={codigo === "senha-curta" ? mensagemDeErro(criar.error) : undefined}
          />
          {criar.isError && !["usuario-sem-nome", "email-invalido", "email-ja-existe", "senha-curta"].includes(codigo ?? "") && (
            <Aviso tom="critico">{mensagemDeErro(criar.error)}</Aviso>
          )}
          {criada && (
            <Aviso tom="ok" titulo="Acesso criado">
              {criada}
            </Aviso>
          )}
          <Botao type="submit" bloco icone="mais" disabled={criar.isPending}>
            {criar.isPending ? "Criando…" : "Criar acesso"}
          </Botao>
        </form>
      </Cartao>
    </Secao>
  );
}

function TrocarSenha() {
  const mudar = useMudarSenha();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [trocada, setTrocada] = useState(false);
  const codigo = codigoDoErro(mudar.error);

  function enviar(e: FormEvent) {
    e.preventDefault();
    setTrocada(false);
    mudar.mutate(
      { atual, nova, confirmacao },
      {
        onSuccess: () => {
          setTrocada(true);
          setAtual("");
          setNova("");
          setConfirmacao("");
        },
      },
    );
  }

  return (
    <Secao titulo="Trocar minha senha">
      <Cartao>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <Campo
            rotulo="Senha atual"
            type="password"
            autoComplete="current-password"
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            erro={codigo === "senha-atual-incorreta" || codigo === "senha-atual-vazia" ? mensagemDeErro(mudar.error) : undefined}
          />
          <Campo
            rotulo="Nova senha"
            type="password"
            autoComplete="new-password"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            dica={`Pelo menos ${SENHA_MINIMA} caracteres.`}
            erro={codigo === "senha-curta" ? mensagemDeErro(mudar.error) : undefined}
          />
          <Campo
            rotulo="Repita a nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            erro={codigo === "senhas-diferentes" ? mensagemDeErro(mudar.error) : undefined}
          />
          {mudar.isError && !["senha-atual-incorreta", "senha-atual-vazia", "senha-curta", "senhas-diferentes"].includes(codigo ?? "") && (
            <Aviso tom="critico">{mensagemDeErro(mudar.error)}</Aviso>
          )}
          {trocada && <Aviso tom="ok" titulo="Senha trocada">Use a nova senha da próxima vez que entrar.</Aviso>}
          <Botao type="submit" variante="secundario" bloco disabled={mudar.isPending}>
            {mudar.isPending ? "Trocando…" : "Trocar senha"}
          </Botao>
        </form>
      </Cartao>
    </Secao>
  );
}
