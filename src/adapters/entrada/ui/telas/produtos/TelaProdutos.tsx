"use client";

import { type FormEvent, useState } from "react";
import { centavos } from "@/core/domain/compartilhado/Dinheiro";
import type { Produto } from "@/core/domain/produto/Produto";
import { Aviso, Botao, Campo, Cartao, Carregando, FalhaAoCarregar, Pagina, Secao, Status, Vazio } from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { dinheiro, dinheiroParaCampo, lerDinheiro } from "../../formatos";
import { useSalvarProduto } from "../../hooks/acoes";
import { useProdutos } from "../../hooks/consultas";

/** Produtos e preços. Mudar o preço não mexe em pedidos já feitos. */
export function TelaProdutos() {
  const produtos = useProdutos();

  return (
    <Pagina>
      <header className="pt-6">
        <h1 className="m-0 font-display text-display">Produtos e preços</h1>
        <p className="m-0 mt-1 text-ink-muted">Mudar o preço vale para os próximos pedidos. Os já feitos guardam o preço da época.</p>
      </header>

      {produtos.isPending ? (
        <Carregando />
      ) : produtos.isError ? (
        <FalhaAoCarregar erro={produtos.error} aoTentarDeNovo={() => produtos.refetch()} />
      ) : produtos.data.length === 0 ? (
        <Vazio>Nenhum produto ainda. Cadastre o primeiro abaixo.</Vazio>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {produtos.data.map((produto) => (
            <li key={produto.id}>
              <CartaoProdutoEditavel produto={produto} />
            </li>
          ))}
        </ul>
      )}

      <NovoProduto />
    </Pagina>
  );
}

function CartaoProdutoEditavel({ produto }: { produto: Produto }) {
  const salvar = useSalvarProduto();
  const [editando, setEditando] = useState(false);
  const [preco, setPreco] = useState(dinheiroParaCampo(produto.preco));
  const [erro, setErro] = useState<string>();

  function salvarPreco(e: FormEvent) {
    e.preventDefault();
    const valor = lerDinheiro(preco);
    if (valor == null || valor <= 0) {
      setErro("Digite o preço, por exemplo 55,00.");
      return;
    }
    salvar.mutate({ tipo: "preco", produtoId: produto.id, preco: centavos(valor) }, { onSuccess: () => setEditando(false) });
  }

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 font-display text-titulo">{produto.nome}</h3>
        {produto.ativo ? <Status estado="disponivel">Ativo</Status> : <Status estado="cancelado">Inativo</Status>}
      </div>
      {editando ? (
        <form onSubmit={salvarPreco} className="flex flex-col gap-3">
          <Campo
            rotulo="Preço (R$)"
            inputMode="decimal"
            value={preco}
            onChange={(e) => {
              setPreco(e.target.value);
              setErro(undefined);
            }}
            erro={erro ?? (salvar.isError ? mensagemDeErro(salvar.error) : undefined)}
            autoFocus
          />
          <div className="flex gap-2">
            <Botao type="submit" variante="secundario" tamanho="md" disabled={salvar.isPending}>
              Salvar preço
            </Botao>
            <Botao variante="fantasma" tamanho="md" onClick={() => setEditando(false)}>
              Cancelar
            </Botao>
          </div>
        </form>
      ) : (
        <>
          <p className="m-0 font-display text-numero-lg tabular-nums">{dinheiro(produto.preco)}</p>
          <div className="flex flex-wrap gap-2">
            <Botao variante="secundario" tamanho="md" onClick={() => setEditando(true)}>
              Mudar preço
            </Botao>
            <Botao
              variante="fantasma"
              tamanho="md"
              disabled={salvar.isPending}
              onClick={() => salvar.mutate({ tipo: "ativo", produtoId: produto.id, ativo: !produto.ativo })}
            >
              {produto.ativo ? "Desativar" : "Ativar"}
            </Botao>
          </div>
          {!produto.ativo && <p className="m-0 text-legenda text-ink-muted">Inativo não aparece no novo pedido nem no novo dia.</p>}
        </>
      )}
    </Cartao>
  );
}

function NovoProduto() {
  const salvar = useSalvarProduto();
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [erroPreco, setErroPreco] = useState<string>();

  function cadastrar(e: FormEvent) {
    e.preventDefault();
    const valor = lerDinheiro(preco);
    if (valor == null || valor <= 0) {
      setErroPreco("Digite o preço, por exemplo 55,00.");
      return;
    }
    salvar.mutate(
      { tipo: "criar", nome, preco: centavos(valor) },
      {
        onSuccess: () => {
          setNome("");
          setPreco("");
        },
      },
    );
  }

  return (
    <Secao titulo="Novo produto">
      <Cartao>
        <form onSubmit={cadastrar} className="flex flex-col gap-3">
          <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Linguiça" />
          <Campo
            rotulo="Preço (R$)"
            inputMode="decimal"
            value={preco}
            onChange={(e) => {
              setPreco(e.target.value);
              setErroPreco(undefined);
            }}
            placeholder="55,00"
            erro={erroPreco}
          />
          {salvar.isError && <Aviso tom="critico">{mensagemDeErro(salvar.error)}</Aviso>}
          <Botao type="submit" bloco icone="mais" disabled={salvar.isPending}>
            Cadastrar produto
          </Botao>
        </form>
      </Cartao>
    </Secao>
  );
}
