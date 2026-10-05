"use client";

import { useMemo, useState } from "react";
import { type Dinheiro, multiplicar, somar } from "@/core/domain/compartilhado/Dinheiro";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { estaAberto } from "@/core/domain/dia-venda/DiaVenda";
import type { Pedido } from "@/core/domain/pedido/Pedido";
import {
  Aviso,
  Botao,
  CabecalhoDia,
  Campo,
  Cartao,
  Carregando,
  FalhaAoCarregar,
  GrupoLista,
  ItemLista,
  LinkBotao,
  Pagina,
  Secao,
  Vazio,
} from "../../componentes";
import { codigoDoErro, mensagemDeErro } from "../../erros";
import { dataCurta, dataLonga, dinheiro, quantidadeDe } from "../../formatos";
import { useAdicionarNaEspera, useCriarPedido, useMudarEspera } from "../../hooks/acoes";
import { useClientePorTelefone, usePainel, useProdutos } from "../../hooks/consultas";
import { useConexao } from "../../hooks/useConexao";
import { AvisoIndisponivel } from "./AvisoIndisponivel";
import type { ExcessoPedido } from "./SeletorItens";
import { SeletorItens } from "./SeletorItens";
import { TelaReservaRealizada } from "./TelaReservaRealizada";

/** Um pedido nasce com nome, produtos e um toque em "Confirmar reserva". Só o nome é obrigatório. */
export function TelaNovoPedido({
  diaId,
  inicial,
}: {
  diaId: string;
  /** Preenchido quando vem da lista de espera; ao reservar, a entrada vira "atendido". */
  inicial?: { nome: string; telefone: string; quantidades: Record<string, number>; esperaId?: string };
}) {
  const painel = usePainel(diaId);
  const produtos = useProdutos();
  const online = useConexao();
  const mudarEspera = useMudarEspera(diaId);

  const [telefone, setTelefone] = useState(inicial?.telefone ?? "");
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [quantidades, setQuantidades] = useState<Record<string, number>>(inicial?.quantidades ?? {});
  const [esperaId, setEsperaId] = useState(inicial?.esperaId);
  const [excesso, setExcesso] = useState<ExcessoPedido | null>(null);
  const [naEspera, setNaEspera] = useState<string | null>(null);
  const [criado, setCriado] = useState<Pedido | null>(null);

  const estoques = painel.data?.estoques;
  const criar = useCriarPedido(estoques);
  const adicionarNaEspera = useAdicionarNaEspera();
  const cliente = useClientePorTelefone(telefone);

  const precos = useMemo(() => new Map<string, Dinheiro>((produtos.data ?? []).map((p) => [p.id, p.preco])), [produtos.data]);
  const ativos = useMemo(() => {
    const inativos = new Set((produtos.data ?? []).filter((p) => !p.ativo).map((p) => p.id));
    return (estoques ?? []).filter((e) => !inativos.has(e.produtoId));
  }, [estoques, produtos.data]);

  if (criado && painel.data) {
    return (
      <TelaReservaRealizada
        pedido={criado}
        dia={painel.data.dia}
        aoNovoPedido={() => {
          setCriado(null);
          setTelefone("");
          setNome("");
          setQuantidades({});
          setNaEspera(null);
          criar.reset();
        }}
      />
    );
  }

  if (painel.isPending || produtos.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando />
      </Pagina>
    );
  }
  if (painel.isError || produtos.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        <FalhaAoCarregar erro={painel.error ?? produtos.error} aoTentarDeNovo={() => (painel.refetch(), produtos.refetch())} />
      </Pagina>
    );
  }

  const { dia } = painel.data;
  const itens = ativos
    .map((e) => ({ produtoId: e.produtoId, nome: e.nome, quantidade: quantidades[e.produtoId] ?? 0 }))
    .filter((i) => i.quantidade > 0);
  const total = somar(...itens.map((i) => multiplicar(precos.get(i.produtoId) ?? (0 as Dinheiro), i.quantidade)));
  const erroNome = codigoDoErro(criar.error) === "cliente-sem-nome" ? mensagemDeErro(criar.error) : undefined;
  const erroGeral =
    criar.error && !erroNome && !(criar.error instanceof QuantidadeIndisponivel) ? mensagemDeErro(criar.error) : undefined;

  function mudarQuantidade(produtoId: string, quantidade: number) {
    setQuantidades((atual) => ({ ...atual, [produtoId]: quantidade }));
    setExcesso(null);
    criar.reset();
  }

  function confirmar(substituir?: Record<string, number>) {
    const finais = { ...quantidades, ...substituir };
    criar.mutate(
      {
        diaId,
        cliente: { nome, telefone },
        itens: ativos.map((e) => ({ produtoId: e.produtoId, quantidade: finais[e.produtoId] ?? 0 })),
      },
      {
        onSuccess: (pedido) => {
          setCriado(pedido);
          if (esperaId) {
            mudarEspera.mutate({ entradaId: esperaId, status: "atendido" });
            setEsperaId(undefined);
          }
        },
        onError: (erro) => {
          if (erro instanceof QuantidadeIndisponivel) {
            setExcesso({ produtoId: erro.produtoId, nome: erro.nome, solicitado: erro.solicitado, maximo: erro.maximo });
          }
        },
      },
    );
  }

  function reservarMaximo() {
    if (!excesso) return;
    const substituir = { [excesso.produtoId]: excesso.maximo };
    setQuantidades((atual) => ({ ...atual, ...substituir }));
    setExcesso(null);
    confirmar(substituir);
  }

  function colocarNaEspera() {
    if (!excesso) return;
    if (nome.trim() === "") {
      setNaEspera(null);
      document.getElementById("nome-cliente")?.focus();
      return;
    }
    const faltam = Math.max(1, excesso.solicitado - excesso.maximo);
    adicionarNaEspera.mutate(
      { diaId, produtoId: excesso.produtoId, cliente: { nome, telefone }, quantidade: faltam },
      {
        onSuccess: (entrada) => {
          setNaEspera(
            `${nome.trim()} entrou na lista de espera: ${quantidadeDe(faltam, excesso.nome.toLowerCase())}, ${entrada.posicao}º da fila.`,
          );
          setQuantidades((atual) => ({ ...atual, [excesso.produtoId]: Math.min(atual[excesso.produtoId] ?? 0, excesso.maximo) }));
          setExcesso(null);
        },
      },
    );
  }

  const podeEnviar = online && estaAberto(dia) && !criar.isPending;

  return (
    <Pagina>
      <CabecalhoDia sobretitulo="Novo pedido" data={dataLonga(dia.data)} />

      {!estaAberto(dia) && (
        <Aviso tom="alerta" titulo="Este dia já foi fechado">
          Escolha outro dia de venda para anotar pedidos.
        </Aviso>
      )}

      <Secao titulo="Cliente">
        <Campo
          rotulo="Telefone"
          inputMode="tel"
          autoComplete="off"
          placeholder="(44) 99999-9999"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          dica="Opcional. Serve para achar o cliente e enviar a confirmação."
          sugestao={
            cliente.data &&
            cliente.data.nome !== nome && (
              <GrupoLista>
                <ItemLista
                  icone="cliente"
                  titulo={cliente.data.nome}
                  subtitulo={
                    cliente.data.pedidosAnteriores === 1 ? "1 pedido anterior" : `${cliente.data.pedidosAnteriores} pedidos anteriores`
                  }
                  onClick={() => setNome(cliente.data!.nome)}
                />
              </GrupoLista>
            )
          }
        />
        <Campo
          id="nome-cliente"
          rotulo="Nome"
          autoComplete="off"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (erroNome) criar.reset();
          }}
          erro={erroNome}
        />
      </Secao>

      <Secao titulo="Produtos">
        {ativos.length === 0 ? (
          <Vazio>Nenhum produto à venda neste dia.</Vazio>
        ) : (
          <SeletorItens
            estoques={ativos}
            precos={precos}
            quantidades={quantidades}
            aoMudar={mudarQuantidade}
            aoExceder={(e) => {
              setNaEspera(null);
              setExcesso(e);
            }}
          />
        )}
      </Secao>

      {excesso && (
        <AvisoIndisponivel
          excesso={excesso}
          ocupado={criar.isPending || adicionarNaEspera.isPending}
          aoReservarMaximo={reservarMaximo}
          aoListaDeEspera={colocarNaEspera}
          aoCancelar={() => {
            setQuantidades((atual) => ({ ...atual, [excesso.produtoId]: Math.min(atual[excesso.produtoId] ?? 0, excesso.maximo) }));
            setExcesso(null);
            criar.reset();
          }}
        />
      )}
      {excesso && nome.trim() === "" && (
        <p className="m-0 -mt-3 text-legenda text-ink-muted">Para a lista de espera, preencha o nome do cliente.</p>
      )}
      {adicionarNaEspera.isError && <Aviso tom="critico">{mensagemDeErro(adicionarNaEspera.error)}</Aviso>}
      {naEspera && (
        <Aviso tom="info" titulo="Na lista de espera">
          {naEspera}
        </Aviso>
      )}

      {itens.length > 0 && (
        <Cartao>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {itens.map((i) => (
              <li key={i.produtoId} className="flex justify-between gap-3">
                <span>{quantidadeDe(i.quantidade, i.nome)}</span>
                <span className="tabular-nums">{dinheiro(multiplicar(precos.get(i.produtoId) ?? (0 as Dinheiro), i.quantidade))}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      {/* Total e "Confirmar reserva" ficam presos acima da barra de baixo, ao alcance do polegar. */}
      <div className="sticky bottom-[calc(88px+env(safe-area-inset-bottom))] z-20 flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3 shadow-flutuante desktop:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-legenda text-ink-muted">Retirada {dataCurta(dia.data)}</span>
            <span className="font-display text-titulo whitespace-nowrap tabular-nums">{dinheiro(total)}</span>
          </div>
          <Botao onClick={() => confirmar()} disabled={!podeEnviar} icone="check" className="grow px-4">
            {criar.isPending ? "Reservando…" : "Confirmar reserva"}
          </Botao>
        </div>
        {erroGeral && <p role="alert" className="m-0 text-legenda font-semibold text-critico">{erroGeral}</p>}
        {!online && <p className="m-0 text-center text-legenda text-critico">Sem conexão: não dá para reservar agora.</p>}
      </div>

      <LinkBotao href={`/dias/${diaId}`} variante="fantasma" bloco>
        Voltar ao início
      </LinkBotao>
    </Pagina>
  );
}
