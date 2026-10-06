"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Folha, GrupoLista, ItemLista, useTema } from "../../componentes";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

/** "Mais": o que não cabe na barra (espera, fechamento, dias, produtos, clientes). */
export function MenuMais({ diaId, aberto, aoFechar }: { diaId: string; aberto: boolean; aoFechar: () => void }) {
  const router = useRouter();
  const { sessao } = useCasosDeUso();
  const tema = useTema();
  const ir = useCallback(
    (href: string) => {
      aoFechar();
      router.push(href);
    },
    [aoFechar, router],
  );

  async function sair() {
    aoFechar();
    await sessao.sair();
    router.replace("/entrar");
  }

  return (
    <Folha titulo="Mais" aberta={aberto} aoFechar={aoFechar}>
      <div className="mt-3">
        <GrupoLista>
          <ItemLista icone="espera" titulo="Lista de espera" onClick={() => ir(`/dias/${diaId}/espera`)} />
          <ItemLista icone="moeda" titulo="Fechamento do dia" onClick={() => ir(`/dias/${diaId}/fechamento`)} />
          <ItemLista icone="relogio" titulo="Dias de venda" subtitulo="Trocar de dia, abrir um novo, histórico" onClick={() => ir("/dias")} />
          <ItemLista icone="producao" titulo="Produtos e preços" onClick={() => ir("/produtos")} />
          <ItemLista icone="cliente" titulo="Clientes" onClick={() => ir("/clientes")} />
          <ItemLista icone="cliente" titulo="Pessoas e senha" subtitulo="Quem tem acesso, trocar minha senha" onClick={() => ir("/pessoas")} />
          <ItemLista icone="menu" titulo="Configurações" subtitulo="Nome, cor, dias de venda, WhatsApp" onClick={() => ir("/configuracoes")} />
          <ItemLista
            icone={tema.proximo === "escuro" ? "lua" : "sol"}
            titulo={tema.proximo === "escuro" ? "Tema escuro" : "Tema claro"}
            subtitulo="Só neste aparelho"
            onClick={tema.alternar}
          />
          <ItemLista icone="fechar" titulo="Sair" onClick={sair} />
        </GrupoLista>
      </div>
    </Folha>
  );
}
