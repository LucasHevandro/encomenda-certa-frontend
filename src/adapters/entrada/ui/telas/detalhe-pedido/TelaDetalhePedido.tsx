"use client";

import { useState } from "react";
import { estaAberto as diaAberto } from "@/core/domain/dia-venda/DiaVenda";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { estaAberto, estaPago, type Pagamento, type Pedido, totalDoItem, totalDoPedido } from "@/core/domain/pedido/Pedido";
import {
  Aviso,
  Botao,
  CabecalhoDia,
  Cartao,
  Carregando,
  Confirmacao,
  FalhaAoCarregar,
  Filtros,
  LinkBotao,
  Pagina,
  Secao,
  Status,
} from "../../componentes";
import { mensagemDeErro } from "../../erros";
import { dataCurta, dataHora, dinheiro, numeroPedido, quantidadeDe, telefone } from "../../formatos";
import { useCancelarPedido, useMarcarRetirado, useReativarPedido, useRegistrarPagamento } from "../../hooks/acoes";
import { useConfiguracao, usePainel, usePedido } from "../../hooks/consultas";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { useConexao } from "../../hooks/useConexao";

const PAGAMENTOS: { id: Pagamento; rotulo: string }[] = [
  { id: "pendente", rotulo: "Pendente" },
  { id: "pix", rotulo: "Pix" },
  { id: "dinheiro", rotulo: "Dinheiro" },
  { id: "cartao", rotulo: "Cartão" },
];

export function TelaDetalhePedido({ diaId, pedidoId }: { diaId: string; pedidoId: string }) {
  const consulta = usePedido(diaId, pedidoId);
  const painel = usePainel(diaId);
  const online = useConexao();
  const { enviarConfirmacao } = useCasosDeUso();
  const configuracao = useConfiguracao();
  const retirar = useMarcarRetirado(diaId);
  const pagar = useRegistrarPagamento(diaId);
  const cancelar = useCancelarPedido(diaId);
  const reativar = useReativarPedido(diaId, painel.data?.estoques);
  const [confirmando, setConfirmando] = useState<"retirada" | "cancelamento" | "reativacao" | null>(null);

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
        <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />
      </Pagina>
    );
  }

  const pedido = consulta.data;
  const dia = painel.data?.dia;
  const podeMexer = online && (!dia || diaAberto(dia));
  const aberto = estaAberto(pedido);
  const unidades = pedido.itens.reduce((t, i) => t + i.quantidade, 0);
  const erro = retirar.error ?? pagar.error ?? cancelar.error;
  const registro = linhasDoRegistro(pedido);

  return (
    <Pagina>
      <CabecalhoDia sobretitulo={`Pedido ${numeroPedido(pedido.numero)}`} data={pedido.cliente.nome} />

      <div className="flex flex-wrap gap-2">
        <Status estado={pedido.retirada} grande />
        {pedido.retirada !== "cancelado" && <Status estado={estaPago(pedido) ? "pago" : "naoPago"} grande />}
      </div>

      <Cartao className="flex flex-col gap-3">
        {pedido.cliente.telefone && <p className="m-0 text-ink-muted">{telefone(pedido.cliente.telefone)}</p>}
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {pedido.itens.map((item) => (
            <li key={item.produtoId} className="flex justify-between gap-3 text-corpo-lg">
              <span>{quantidadeDe(item.quantidade, item.nome)}</span>
              <span className="tabular-nums">{dinheiro(totalDoItem(item))}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-ink-muted">{dia ? `Retirada ${dataCurta(dia.data)}` : "Total"}</span>
          <span className="font-display text-numero-lg tabular-nums">{dinheiro(totalDoPedido(pedido))}</span>
        </div>
      </Cartao>

      {registro.length > 0 && (
        <ul aria-label="Quem fez" className="m-0 -mt-2 flex list-none flex-col gap-1 p-0 text-rotulo font-normal text-ink-muted">
          {registro.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>
      )}

      {pedido.retirada !== "cancelado" && (
        <Secao titulo="Pagamento">
          <Filtros<Pagamento>
            rotulo="Forma de pagamento"
            opcoes={PAGAMENTOS.filter((p) => p.id === "pendente" || p.id === pedido.pagamento || configuracao.formasDePagamento.includes(p.id))}
            ativo={pedido.pagamento}
            aoMudar={(pagamento) => podeMexer && pagar.mutate({ pedidoId: pedido.id, pagamento })}
          />
        </Secao>
      )}

      {erro && <Aviso tom="critico">{mensagemDeErro(erro)}</Aviso>}
      {reativar.isError && (
        <Aviso tom="critico" titulo="Não dá para reativar">
          {mensagemDeErro(reativar.error)}
          {reativar.error instanceof QuantidadeIndisponivel && " As unidades já foram para outros pedidos. Se o cliente ainda quiser, faça um novo pedido com o que está disponível."}
        </Aviso>
      )}

      <div className="flex flex-col gap-2">
        {aberto && (
          <Botao bloco icone="check" disabled={!podeMexer} onClick={() => setConfirmando("retirada")}>
            Marcar como retirado
          </Botao>
        )}
        {pedido.retirada !== "cancelado" && dia && (
          <Botao variante="secundario" bloco icone="mensagem" onClick={() => enviarConfirmacao.executar(pedido, dia, configuracao)}>
            Enviar WhatsApp
          </Botao>
        )}
        {aberto && podeMexer && (
          <LinkBotao href={`/dias/${diaId}/pedidos/${pedido.id}/editar`} bloco>
            Editar pedido
          </LinkBotao>
        )}
        {aberto && (
          <Botao variante="perigo" bloco icone="fechar" disabled={!podeMexer} onClick={() => setConfirmando("cancelamento")}>
            Cancelar reserva
          </Botao>
        )}
        {pedido.retirada === "cancelado" && (
          <Botao variante="secundario" bloco icone="relogio" disabled={!podeMexer} onClick={() => setConfirmando("reativacao")}>
            Reativar reserva
          </Botao>
        )}
        <LinkBotao href={`/dias/${diaId}/pedidos`} variante="fantasma" bloco>
          Voltar aos pedidos
        </LinkBotao>
      </div>

      <Confirmacao
        aberto={confirmando === "retirada"}
        titulo={`Confirmar retirada do pedido ${numeroPedido(pedido.numero)}?`}
        confirmar="Confirmar retirada"
        ocupado={retirar.isPending}
        aoCancelar={() => setConfirmando(null)}
        aoConfirmar={() => retirar.mutate(pedido.id, { onSettled: () => setConfirmando(null) })}
      >
        {pedido.cliente.nome} leva {unidades === 1 ? "1 item" : `${unidades} itens`}.
        {!estaPago(pedido) && " O pagamento continua como não pago até você marcar."}
      </Confirmacao>

      <Confirmacao
        aberto={confirmando === "cancelamento"}
        perigo
        titulo={`Cancelar a reserva ${numeroPedido(pedido.numero)}?`}
        confirmar="Cancelar reserva"
        ocupado={cancelar.isPending}
        aoCancelar={() => setConfirmando(null)}
        aoConfirmar={() => cancelar.mutate(pedido.id, { onSettled: () => setConfirmando(null) })}
      >
        {unidades === 1 ? "1 unidade volta" : `${unidades} unidades voltam`} para venda. O pedido continua na lista como cancelado.
      </Confirmacao>
      <Confirmacao
        aberto={confirmando === "reativacao"}
        titulo={`Reativar a reserva ${numeroPedido(pedido.numero)}?`}
        confirmar="Reativar reserva"
        ocupado={reativar.isPending}
        aoCancelar={() => setConfirmando(null)}
        aoConfirmar={() => reativar.mutate(pedido, { onSettled: () => setConfirmando(null) })}
      >
        {unidades === 1 ? "1 unidade volta" : `${unidades} unidades voltam`} a ficar reservadas para {pedido.cliente.nome}, se ainda houver disponível.
      </Confirmacao>
    </Pagina>
  );
}

/** "Reservado por Lusca · 04/10 às 14:32", uma linha por passo. */
function linhasDoRegistro(pedido: Pedido): string[] {
  const r = pedido.registro;
  if (!r) return [];
  const linha = (verbo: string, quem?: string, em?: string) =>
    quem || em ? [`${verbo}${quem ? ` por ${quem}` : ""}${em ? ` · ${dataHora(em)}` : ""}`] : [];
  return [...linha("Reservado", r.reservadoPor, r.reservadoEm), ...linha("Retirado", r.retiradoPor, r.retiradoEm), ...linha("Cancelado", r.canceladoPor, r.canceladoEm)];
}
