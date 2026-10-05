"use client";

import { estaAberto } from "@/core/domain/dia-venda/DiaVenda";
import { Carregando, FalhaAoCarregar, GrupoLista, ItemLista, LinkBotao, Pagina, Secao, Vazio } from "../../componentes";
import { dataCompleta, dataCurta, dataIso, diaDaSemana, dinheiroCurto } from "../../formatos";
import { useDias } from "../../hooks/consultas";

/** Dias de venda: abertos com pedidos e disponíveis; encerrados com faturamento e sobras. */
export function TelaDias() {
  const dias = useDias();
  const hoje = dataIso(new Date());

  return (
    <Pagina>
      <header className="flex items-end justify-between gap-3 pt-6">
        <h1 className="m-0 font-display text-display">Dias de venda</h1>
        <LinkBotao href="/dias/novo" variante="primario" tamanho="md" icone="mais">
          Abrir novo dia
        </LinkBotao>
      </header>
      <LinkBotao href="/dias/relatorio" variante="secundario" tamanho="md" icone="producao" className="-mt-3 self-start">
        Relatório entre dias
      </LinkBotao>

      {dias.isPending ? (
        <Carregando />
      ) : dias.isError ? (
        <FalhaAoCarregar erro={dias.error} aoTentarDeNovo={() => dias.refetch()} />
      ) : (
        <>
          <Secao titulo="Abertos">
            {dias.data.filter((r) => estaAberto(r.dia)).length === 0 ? (
              <Vazio
                acao={
                  <LinkBotao href="/dias/novo" tamanho="md">
                    Abrir novo dia
                  </LinkBotao>
                }
              >
                Nenhum dia aberto. Abra o próximo domingo para começar a anotar pedidos.
              </Vazio>
            ) : (
              <GrupoLista>
                {dias.data
                  .filter((r) => estaAberto(r.dia))
                  .map(({ dia, pedidos, itensDisponiveis }) => (
                    <ItemLista
                      key={dia.id}
                      href={`/dias/${dia.id}`}
                      icone={dia.data === hoje ? "inicio" : "relogio"}
                      titulo={dia.data === hoje ? `Hoje, ${dataCurta(dia.data).split(", ")[1]}` : dataCurta(dia.data)}
                      subtitulo={`${pedidos === 1 ? "1 pedido" : `${pedidos} pedidos`} · ${itensDisponiveis} disponíveis`}
                    />
                  ))}
              </GrupoLista>
            )}
          </Secao>

          {dias.data.some((r) => !estaAberto(r.dia)) && (
            <Secao titulo="Encerrados">
              <GrupoLista>
                {dias.data
                  .filter((r) => !estaAberto(r.dia))
                  .reverse()
                  .map(({ dia, faturamento, sobras }) => (
                    <ItemLista
                      key={dia.id}
                      href={`/dias/${dia.id}/fechamento`}
                      icone="check"
                      titulo={dataCompleta(dia.data)}
                      subtitulo={`${diaDaSemana(dia.data)}${sobras != null ? ` · ${sobras === 1 ? "1 sobra" : `${sobras} sobras`}` : ""}`}
                      direita={faturamento != null ? dinheiroCurto(faturamento) : undefined}
                    />
                  ))}
              </GrupoLista>
            </Secao>
          )}
        </>
      )}
    </Pagina>
  );
}
