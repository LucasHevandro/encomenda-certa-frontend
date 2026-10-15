"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useState } from "react";
import type { EventoDoDia } from "@/core/application/portas/EventosTempoReal";
import { Aviso, BarraNavegacao, Botao, type ItemNavegacao, LinkBotao } from "../../componentes";
import { numeroPedido, quantidadeDe } from "../../formatos";
import { usePainel } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";
import { useTempoReal } from "../../hooks/useTempoReal";
import { NomeDoEstabelecimento } from "../geral/Marca";
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
  /** produtoId → unidades liberadas desde o último "Fechar". Um cancelamento pode liberar vários produtos. */
  const [liberadas, setLiberadas] = useState<Record<string, number>>({});
  /** Pedidos que clientes fizeram pela página desde o último "Fechar". */
  const [novosOnline, setNovosOnline] = useState<{ numero: number; cliente: string }[]>([]);
  const { data: painel } = usePainel(diaId);

  const aoReceber = useCallback((evento: EventoDoDia) => {
    if (evento.tipo === "pedido-online") setNovosOnline((atual) => [...atual, { numero: evento.numero, cliente: evento.cliente }]);
    if (evento.tipo !== "unidades-liberadas") return;
    setLiberadas((atual) => ({ ...atual, [evento.produtoId]: (atual[evento.produtoId] ?? 0) + evento.quantidade }));
  }, []);
  useTempoReal(diaId, aoReceber);

  const nomeDe = (produtoId: string) => painel?.estoques.find((e) => e.produtoId === produtoId)?.nome ?? produtoId;
  const produtosLiberados = Object.keys(liberadas);
  const totalLiberado = Object.values(liberadas).reduce((t, n) => t + n, 0);
  const comFila = produtosLiberados.filter((id) => (painel?.clientesAguardando[id] ?? 0) > 0);
  const fechar = () => setLiberadas({});

  return (
    <div className="flex min-h-dvh flex-col pb-28 desktop:pb-0 desktop:pl-60">
      {!online && (
        <div role="alert" className="sticky top-0 z-30 bg-critico px-4 py-2 text-center text-rotulo text-on-brasa">
          Sem conexão. Reservas e alterações ficam travadas até a internet voltar.
        </div>
      )}
      {novosOnline.length > 0 && (
        <div className="mx-auto w-full max-w-coluna px-4 pt-4 tablet:max-w-2xl tablet:px-6">
          <Aviso
            tom="info"
            icone="online"
            titulo={novosOnline.length === 1 ? `Novo pedido online ${numeroPedido(novosOnline[0].numero)}` : `${novosOnline.length} pedidos online novos`}
            acoes={
              <>
                <LinkBotao href={`${base}/pedidos`} tamanho="md" onClick={() => setNovosOnline([])}>
                  Ver pedidos
                </LinkBotao>
                <Botao variante="fantasma" tamanho="md" onClick={() => setNovosOnline([])}>
                  Fechar
                </Botao>
              </>
            }
          >
            {novosOnline.map((p) => `${numeroPedido(p.numero)} ${p.cliente}`).join(", ")} {novosOnline.length === 1 ? "reservou" : "reservaram"} pela página da loja.
          </Aviso>
        </div>
      )}
      {totalLiberado > 0 && (
        <div className="mx-auto w-full max-w-coluna px-4 pt-4 tablet:max-w-2xl tablet:px-6">
          <Aviso
            tom="info"
            titulo={totalLiberado === 1 ? "1 unidade foi liberada" : `${totalLiberado} unidades foram liberadas`}
            acoes={
              <>
                {comFila.length > 0 && (
                  <LinkBotao href={`${base}/espera`} tamanho="md" onClick={fechar}>
                    Ver lista de espera
                  </LinkBotao>
                )}
                <Botao variante="fantasma" tamanho="md" onClick={fechar}>
                  Fechar
                </Botao>
              </>
            }
          >
            {produtosLiberados.map((id) => quantidadeDe(liberadas[id], nomeDe(id).toLowerCase())).join(" e ")} de volta para venda.
            {comFila.length > 0 && ` Existem clientes aguardando ${comFila.map(nomeDe).join(" e ")}.`}
          </Aviso>
        </div>
      )}
      {children}
      <BarraNavegacao
        ativo={itemAtivo(caminho, base)}
        links={{ inicio: base, pedidos: `${base}/pedidos`, novo: `${base}/pedidos/novo`, producao: `${base}/producao` }}
        aoAbrirMais={() => setMenuAberto(true)}
        titulo={<NomeDoEstabelecimento />}
      />
      <MenuMais diaId={diaId} aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
    </div>
  );
}
