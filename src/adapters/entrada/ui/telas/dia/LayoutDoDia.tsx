"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useState } from "react";
import type { EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import { Aviso, BarraNavegacao, Botao, type ItemNavegacao, LinkBotao } from "../../componentes";
import { usePainel } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";
import { useTempoReal } from "../../hooks/useTempoReal";
import { MenuMais } from "./MenuMais";

function itemAtivo(caminho: string, base: string): ItemNavegacao {
  if (caminho === base) return "inicio";
  if (caminho.startsWith(`${base}/pedidos/novo`)) return "novo";
  if (caminho.startsWith(`${base}/pedidos`)) return "pedidos";
  if (caminho.startsWith(`${base}/producao`)) return "producao";
  return "mais";
}

/** Casca de tudo que pertence a um dia: tempo real, barra de navegação e avisos do dia. */
export function LayoutDoDia({ diaId, children }: { diaId: string; children: ReactNode }) {
  const base = `/dias/${diaId}`;
  const caminho = usePathname();
  const online = useConexao();
  const [menuAberto, setMenuAberto] = useState(false);
  const [liberadas, setLiberadas] = useState<{ produtoId: string; quantidade: number } | null>(null);
  const { data: painel } = usePainel(diaId);

  const aoReceber = useCallback((evento: EventoDoDia) => {
    if (evento.tipo === "unidades-liberadas") setLiberadas(evento);
  }, []);
  useTempoReal(diaId, aoReceber);

  const produto = liberadas && painel?.estoques.find((e) => e.produtoId === liberadas.produtoId);
  const aguardando = liberadas ? (painel?.clientesAguardando[liberadas.produtoId] ?? 0) : 0;

  return (
    <div className="flex min-h-dvh flex-col pb-28 desktop:pb-0 desktop:pl-60">
      {!online && (
        <div role="alert" className="sticky top-0 z-30 bg-critico px-4 py-2 text-center text-rotulo text-on-brasa">
          Sem conexão. Reservas e alterações ficam travadas até a internet voltar.
        </div>
      )}
      {liberadas && produto && (
        <div className="mx-auto w-full max-w-coluna px-4 pt-4 tablet:max-w-2xl tablet:px-6">
          <Aviso
            tom="info"
            titulo={`${liberadas.quantidade} ${liberadas.quantidade === 1 ? "unidade foi liberada" : "unidades foram liberadas"}`}
            acoes={
              <>
                {aguardando > 0 && (
                  <LinkBotao href={`${base}/espera`} tamanho="md" onClick={() => setLiberadas(null)}>
                    Ver lista de espera
                  </LinkBotao>
                )}
                <Botao variante="fantasma" tamanho="md" onClick={() => setLiberadas(null)}>
                  Fechar
                </Botao>
              </>
            }
          >
            {produto.nome} voltou a ter unidades para vender.
            {aguardando > 0 && ` Existem ${aguardando === 1 ? "1 cliente aguardando" : `${aguardando} clientes aguardando`} este produto.`}
          </Aviso>
        </div>
      )}
      {children}
      <BarraNavegacao
        ativo={itemAtivo(caminho, base)}
        links={{ inicio: base, pedidos: `${base}/pedidos`, novo: `${base}/pedidos/novo`, producao: `${base}/producao` }}
        aoAbrirMais={() => setMenuAberto(true)}
      />
      <MenuMais diaId={diaId} aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
    </div>
  );
}
