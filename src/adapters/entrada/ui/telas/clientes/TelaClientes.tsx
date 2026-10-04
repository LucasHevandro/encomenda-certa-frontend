"use client";

import { useState } from "react";
import { Busca, Carregando, FalhaAoCarregar, GrupoLista, ItemLista, Pagina, Vazio } from "../../componentes";
import { telefone } from "../../formatos";
import { useClientes } from "../../hooks/consultas";

/** Clientes que já reservaram, com o número de pedidos. O cadastro nasce sozinho no primeiro pedido. */
export function TelaClientes() {
  const clientes = useClientes();
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, "");
  const visiveis = (clientes.data ?? []).filter(
    (c) => !termo || c.nome.toLowerCase().includes(termo) || (digitos !== "" && (c.telefone ?? "").includes(digitos)),
  );

  return (
    <Pagina>
      <header className="pt-6">
        <h1 className="m-0 font-display text-display">Clientes</h1>
        <p className="m-0 mt-1 text-ink-muted">Quem já reservou aparece aqui. Ninguém precisa ser cadastrado antes do pedido.</p>
      </header>
      <Busca valor={busca} aoMudar={setBusca} placeholder="Nome ou telefone" rotulo="Buscar cliente" />
      {clientes.isPending ? (
        <Carregando />
      ) : clientes.isError ? (
        <FalhaAoCarregar erro={clientes.error} aoTentarDeNovo={() => clientes.refetch()} />
      ) : visiveis.length === 0 ? (
        <Vazio>{termo ? `Nenhum cliente encontrado para "${busca.trim()}".` : "Nenhum cliente ainda."}</Vazio>
      ) : (
        <GrupoLista>
          {visiveis.map((cliente) => (
            <ItemLista
              key={cliente.id}
              icone="cliente"
              titulo={cliente.nome}
              subtitulo={cliente.telefone ? telefone(cliente.telefone) : "Sem telefone"}
              direita={cliente.pedidosAnteriores === 1 ? "1 pedido" : `${cliente.pedidosAnteriores} pedidos`}
            />
          ))}
        </GrupoLista>
      )}
    </Pagina>
  );
}
