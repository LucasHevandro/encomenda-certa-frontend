"use client";

import { Aviso, Botao } from "../../componentes";
import { quantidadeDe } from "../../formatos";
import type { ExcessoPedido } from "./SeletorItens";

/** "Quantidade indisponível" com as três saídas: Reservar N, Lista de espera, Cancelar. */
export function AvisoIndisponivel({
  excesso,
  ocupado,
  aoReservarMaximo,
  aoListaDeEspera,
  aoCancelar,
}: {
  excesso: ExcessoPedido;
  ocupado?: boolean;
  aoReservarMaximo?: () => void;
  aoListaDeEspera?: () => void;
  aoCancelar: () => void;
}) {
  const { nome, maximo } = excesso;
  const nomeMinusculo = nome.toLowerCase();
  return (
    <Aviso
      tom="critico"
      titulo={maximo === 0 ? `${nome} esgotado` : "Quantidade indisponível"}
      acoes={
        <>
          {maximo > 0 && aoReservarMaximo && (
            <Botao variante="secundario" tamanho="md" onClick={aoReservarMaximo} disabled={ocupado}>
              Reservar {maximo}
            </Botao>
          )}
          {aoListaDeEspera && (
            <Botao variante="secundario" tamanho="md" icone="espera" onClick={aoListaDeEspera} disabled={ocupado}>
              Lista de espera
            </Botao>
          )}
          <Botao variante="fantasma" tamanho="md" onClick={aoCancelar}>
            Cancelar
          </Botao>
        </>
      }
    >
      {maximo === 0 ? (
        <p className="m-0">Não há mais {nomeMinusculo} para reservar. Você pode adicionar o cliente à lista de espera.</p>
      ) : (
        <p className="m-0">
          {maximo === 1 ? "Existe apenas " : "Existem apenas "}
          <strong>{quantidadeDe(maximo, nomeMinusculo)}</strong> {maximo === 1 ? "disponível" : "disponíveis"} para reserva. Você pode reservar{" "}
          {maximo === 1 ? "1 unidade" : `${maximo} unidades`}
          {aoListaDeEspera ? " ou adicionar o cliente à lista de espera." : "."}
        </p>
      )}
    </Aviso>
  );
}
