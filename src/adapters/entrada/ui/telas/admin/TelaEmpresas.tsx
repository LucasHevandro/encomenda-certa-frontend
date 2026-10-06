"use client";

import { type FormEvent, useState } from "react";
import { SENHA_MINIMA } from "@/core/application/casos-de-uso/auth/GerenciarUsuarios";
import type { Empresa } from "@/core/application/portas/EmpresasGateway";
import { Aviso, Botao, Campo, Cartao, Carregando, Confirmacao, FalhaAoCarregar, Pagina, Secao, Vazio } from "../../componentes";
import { cx } from "../../componentes/cx";
import { codigoDoErro, mensagemDeErro } from "../../erros";
import { useCriarEmpresa, useMudarEmpresa } from "../../hooks/acoes";
import { useEmpresas } from "../../hooks/consultas";

const desde = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

/** Painel do administrador: cada estabelecimento que usa o sistema, com o primeiro acesso de cada um. */
export function TelaEmpresas() {
  const empresas = useEmpresas();

  return (
    <Pagina>
      <header className="pt-6">
        <h1 className="m-0 font-display text-display">Empresas</h1>
        <p className="m-0 mt-1 text-ink-muted">Cada empresa só enxerga os próprios pedidos, produtos, clientes e pessoas.</p>
      </header>

      <Secao titulo="Estabelecimentos">
        {empresas.isPending ? (
          <Carregando linhas={3} />
        ) : empresas.isError ? (
          <FalhaAoCarregar erro={empresas.error} aoTentarDeNovo={() => empresas.refetch()} />
        ) : empresas.data.length === 0 ? (
          <Vazio>Nenhuma empresa ainda. Crie a primeira abaixo.</Vazio>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {empresas.data.map((empresa) => (
              <LinhaEmpresa key={empresa.id} empresa={empresa} />
            ))}
          </ul>
        )}
      </Secao>

      <NovaEmpresa />
    </Pagina>
  );
}

function LinhaEmpresa({ empresa }: { empresa: Empresa }) {
  const mudar = useMudarEmpresa();
  const [confirmando, setConfirmando] = useState(false);
  const pessoas = empresa.usuarios === 1 ? "1 pessoa" : `${empresa.usuarios} pessoas`;

  function alternar(ativa: boolean) {
    mudar.mutate({ id: empresa.id, ativa }, { onSuccess: () => setConfirmando(false) });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised p-4 shadow-cartao">
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 text-[17px] font-semibold">
          {empresa.nome}
          <span
            className={cx(
              "rounded-full px-2.5 py-0.5 text-legenda font-semibold",
              empresa.ativa ? "bg-ok-soft text-ok" : "bg-surface-sunken text-ink-muted",
            )}
          >
            {empresa.ativa ? "Ativa" : "Desativada"}
          </span>
        </span>
        <span className="text-rotulo font-normal text-ink-muted">
          {pessoas} · desde {desde(empresa.criadaEm)}
        </span>
      </div>
      {empresa.ativa ? (
        <Botao variante="secundario" tamanho="md" onClick={() => setConfirmando(true)}>
          Desativar
        </Botao>
      ) : (
        <Botao variante="secundario" tamanho="md" disabled={mudar.isPending} onClick={() => alternar(true)}>
          {mudar.isPending ? "Reativando…" : "Reativar"}
        </Botao>
      )}
      {mudar.isError && (
        <div className="basis-full">
          <Aviso tom="critico">{mensagemDeErro(mudar.error)}</Aviso>
        </div>
      )}
      <Confirmacao
        titulo={`Desativar ${empresa.nome}?`}
        confirmar="Desativar"
        perigo
        aberto={confirmando}
        ocupado={mudar.isPending}
        aoConfirmar={() => alternar(false)}
        aoCancelar={() => setConfirmando(false)}
      >
        Ninguém de {empresa.nome} consegue entrar enquanto estiver desativada, e quem estiver usando sai na próxima ação. Os dados ficam guardados e voltam ao
        reativar.
      </Confirmacao>
    </li>
  );
}

function NovaEmpresa() {
  const criar = useCriarEmpresa();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [criada, setCriada] = useState<string | null>(null);
  const codigo = codigoDoErro(criar.error);
  const erroDe = (...codigos: string[]) => (codigo && codigos.includes(codigo) ? mensagemDeErro(criar.error) : undefined);
  const tratados = ["empresa-sem-nome", "usuario-sem-nome", "email-invalido", "email-ja-existe", "senha-curta"];

  function enviar(e: FormEvent) {
    e.preventDefault();
    setCriada(null);
    criar.mutate(
      { nome: nomeEmpresa, usuario: { nome, email, senha } },
      {
        onSuccess: ({ empresa, usuario }) => {
          setCriada(`${usuario.nome} já pode entrar em ${empresa.nome} com ${usuario.email} e a senha inicial.`);
          setNomeEmpresa("");
          setNome("");
          setEmail("");
          setSenha("");
        },
      },
    );
  }

  return (
    <Secao titulo="Nova empresa">
      <Cartao>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <Campo
            rotulo="Nome do estabelecimento"
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
            autoComplete="off"
            dica="Aparece no app; a própria empresa pode mudar em Configurações."
            erro={erroDe("empresa-sem-nome")}
          />
          <p className="m-0 mt-2 text-rotulo text-ink-muted">Primeiro acesso. Essa pessoa cadastra as outras pela tela Pessoas.</p>
          <Campo rotulo="Nome da pessoa" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" erro={erroDe("usuario-sem-nome")} />
          <Campo
            rotulo="E-mail"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erroDe("email-invalido", "email-ja-existe")}
          />
          <Campo
            rotulo="Senha inicial"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            dica={`Pelo menos ${SENHA_MINIMA} caracteres. A pessoa pode trocar depois.`}
            erro={erroDe("senha-curta")}
          />
          {criar.isError && !tratados.includes(codigo ?? "") && <Aviso tom="critico">{mensagemDeErro(criar.error)}</Aviso>}
          {criada && (
            <Aviso tom="ok" titulo="Empresa criada">
              {criada}
            </Aviso>
          )}
          <Botao type="submit" bloco icone="mais" disabled={criar.isPending}>
            {criar.isPending ? "Criando…" : "Criar empresa"}
          </Botao>
        </form>
      </Cartao>
    </Secao>
  );
}
