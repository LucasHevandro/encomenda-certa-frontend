"use client";

import type { DiaVenda } from "@/core/domain/dia-venda/DiaVenda";
import { type Pedido, totalDoItem, totalDoPedido } from "@/core/domain/pedido/Pedido";
import { Botao, Cartao, Icone, LinkBotao, Pagina, Status } from "../../componentes";
import { dataCurta, dinheiro, numeroPedido, quantidadeDe } from "../../formatos";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";

/** "Reserva realizada!" é a única exclamação do produto. */
export function TelaReservaRealizada({ pedido, dia, aoNovoPedido }: { pedido: Pedido; dia: DiaVenda; aoNovoPedido: () => void }) {
  const { enviarConfirmacao } = useCasosDeUso();

  return (
    <Pagina>
      <div className="flex flex-col items-center gap-3 pt-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-ok-soft text-ok">
          <Icone nome="check" tamanho={36} />
        </span>
        <h1 className="m-0 font-display text-display">Reserva realizada!</h1>
        <p className="m-0 text-corpo-lg text-ink-muted">
          Pedido <strong className="text-ink tabular-nums">{numeroPedido(pedido.numero)}</strong> · {pedido.cliente.nome}
        </p>
      </div>

      <Cartao className="flex flex-col gap-3">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {pedido.itens.map((item) => (
            <li key={item.produtoId} className="flex justify-between gap-3 text-corpo-lg">
              <span>{quantidadeDe(item.quantidade, item.nome)}</span>
              <span className="tabular-nums">{dinheiro(totalDoItem(item))}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-ink-muted">Retirada {dataCurta(dia.data)}</span>
          <span className="font-display text-numero-lg tabular-nums">{dinheiro(totalDoPedido(pedido))}</span>
        </div>
        <div>
          <Status estado="reservado" />
        </div>
      </Cartao>

      <div className="flex flex-col gap-2">
        <Botao variante="secundario" bloco icone="mensagem" onClick={() => enviarConfirmacao.executar(pedido, dia)}>
          Enviar confirmação pelo WhatsApp
        </Botao>
        <LinkBotao href={`/dias/${dia.id}/pedidos/${pedido.id}`} bloco icone="pedidos">
          Ver pedido
        </LinkBotao>
        <Botao bloco icone="mais" onClick={aoNovoPedido}>
          Novo pedido
        </Botao>
      </div>
    </Pagina>
  );
}
