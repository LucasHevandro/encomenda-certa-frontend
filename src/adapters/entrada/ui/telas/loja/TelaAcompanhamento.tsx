"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { multiplicar } from "@/core/domain/compartilhado/Dinheiro";
import { Aviso, Botao, Cartao, Carregando, Confirmacao, FalhaAoCarregar, Icone, LinkBotao, Pagina, Status, Vazio } from "../../componentes";
import { codigoDoErro, mensagemDeErro } from "../../erros";
import { dataCurta, dinheiro, numeroPedido, prazo, quantidadeDe } from "../../formatos";
import { chaves } from "../../hooks/chaves";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { EstiloDaMarca } from "../geral/Marca";

/** O pedido visto pelo link do cliente: situação, itens, retirada e o cancelamento dentro do prazo. */
export function TelaAcompanhamento({ codigo, novo }: { codigo: string; novo?: boolean }) {
  const { loja: pagina } = useCasosDeUso();
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: chaves.acompanhamento(codigo), queryFn: () => pagina.acompanhar(codigo), refetchInterval: 60_000 });
  const cancelar = useMutation({
    mutationFn: () => pagina.cancelar(codigo),
    onSuccess: (atualizado) => queryClient.setQueryData(chaves.acompanhamento(codigo), atualizado),
  });
  const [confirmando, setConfirmando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (consulta.data) document.title = `Pedido ${numeroPedido(consulta.data.numero)} · ${consulta.data.estabelecimento.nome}`;
  }, [consulta.data]);

  if (consulta.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando linhas={2} />
      </Pagina>
    );
  }
  if (consulta.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        {codigoDoErro(consulta.error) === "nao-encontrado" ? (
          <Vazio>Não encontramos este pedido. Confira se o link está completo.</Vazio>
        ) : (
          <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />
        )}
      </Pagina>
    );
  }

  const pedido = consulta.data;
  const loja = pedido.estabelecimento;
  const reservado = pedido.retirada === "reservado";

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href.replace(/\?.*$/, ""));
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <>
      <EstiloDaMarca cor={loja.corPrincipal} />
      <Pagina>
        {novo && reservado ? (
          <div className="flex flex-col items-center gap-3 pt-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-ok-soft text-ok">
              <Icone nome="check" tamanho={36} />
            </span>
            <h1 className="m-0 font-display text-display">Reserva realizada!</h1>
            <p className="m-0 text-corpo-lg text-ink-muted">
              Pedido <strong className="text-ink tabular-nums">{numeroPedido(pedido.numero)}</strong> · {pedido.cliente}
            </p>
          </div>
        ) : (
          <header className="flex flex-col gap-1 pt-6">
            <p className="m-0 text-rotulo tracking-[.06em] text-brasa uppercase">
              {loja.nome} · Pedido {numeroPedido(pedido.numero)}
            </p>
            <h1 className="m-0 font-display text-display">{pedido.cliente}</h1>
          </header>
        )}

        <div className="flex flex-wrap gap-2">
          <Status estado={pedido.retirada} grande>
            {reservado ? "Reservado · retire no dia" : undefined}
          </Status>
        </div>

        <Cartao className="flex flex-col gap-3">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {pedido.itens.map((item) => (
              <li key={item.nome} className="flex justify-between gap-3 text-corpo-lg">
                <span>{quantidadeDe(item.quantidade, item.nome)}</span>
                <span className="tabular-nums">{dinheiro(multiplicar(item.precoUnitario, item.quantidade))}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <span className="text-ink-muted">Pagamento na retirada</span>
            <span className="font-display text-numero-lg whitespace-nowrap tabular-nums">{dinheiro(pedido.total)}</span>
          </div>
        </Cartao>

        <section className="flex flex-col gap-1">
          <span className="text-rotulo text-ink-muted">Retirada</span>
          <span className="text-corpo-lg">
            {dataCurta(pedido.data)} · {loja.nome}
          </span>
          {loja.enderecoRetirada && <span className="text-ink-muted">{loja.enderecoRetirada}</span>}
        </section>

        {reservado && (
          <Aviso
            tom="info"
            icone="link"
            titulo="Guarde este link"
            acoes={
              <Botao variante="secundario" tamanho="md" onClick={copiarLink}>
                {copiado ? "Link copiado" : "Copiar link"}
              </Botao>
            }
          >
            É por ele que você acompanha e, se precisar, cancela o pedido.
          </Aviso>
        )}

        {cancelar.isError && <Aviso tom="critico">{mensagemDeErro(cancelar.error)}</Aviso>}

        <div className="flex flex-col gap-2">
          {pedido.podeCancelar ? (
            <>
              <Botao variante="perigo" bloco icone="fechar" onClick={() => setConfirmando(true)}>
                Cancelar pedido
              </Botao>
              <p className="m-0 text-center text-legenda text-ink-muted">Dá para cancelar até {prazo(pedido.cancelavelAte)}.</p>
            </>
          ) : (
            reservado && <p className="m-0 text-center text-legenda text-ink-muted">O prazo para cancelar por aqui acabou. Se precisar, fale com a loja.</p>
          )}
          {loja.endereco && (
            <LinkBotao href={`/loja/${loja.endereco}`} bloco>
              Fazer outro pedido
            </LinkBotao>
          )}
        </div>

        <Confirmacao
          aberto={confirmando}
          perigo
          titulo={`Cancelar o pedido ${numeroPedido(pedido.numero)}?`}
          confirmar="Cancelar pedido"
          cancelar="Manter pedido"
          ocupado={cancelar.isPending}
          aoCancelar={() => setConfirmando(false)}
          aoConfirmar={() => cancelar.mutate(undefined, { onSettled: () => setConfirmando(false) })}
        >
          Os itens voltam para a venda e não dá para desfazer por aqui.
        </Confirmacao>
      </Pagina>
    </>
  );
}
