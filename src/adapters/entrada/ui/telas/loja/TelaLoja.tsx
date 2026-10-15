"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import type { DiaDaLoja, Loja, ProdutoDaLoja } from "@/core/application/portas/LojaGateway";
import { type Dinheiro, multiplicar, somar } from "@/core/domain/compartilhado/Dinheiro";
import { QuantidadeIndisponivel } from "@/core/domain/disponibilidade/Disponibilidade";
import { Aviso, Botao, Campo, Cartao, Carregando, FalhaAoCarregar, Filtros, Folha, Icone, Pagina, Quantidade, Secao, Status, Vazio } from "../../componentes";
import { codigoDoErro, mensagemDeErro } from "../../erros";
import { dataCurta, dinheiro, prazo, quantidadeDe } from "../../formatos";
import { chaves } from "../../hooks/chaves";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { useConexao } from "../../hooks/useConexao";
import { EstiloDaMarca } from "../geral/Marca";
import { lembrarCliente, lerCliente } from "./dadosDoCliente";

/** Página pública da loja: o cliente escolhe o dia e os produtos, informa nome e WhatsApp e reserva. */
export function TelaLoja({ endereco }: { endereco: string }) {
  const { loja: pagina } = useCasosDeUso();
  // Volta a buscar de tempos em tempos: a disponibilidade muda com os pedidos do balcão.
  const consulta = useQuery({ queryKey: chaves.loja(endereco), queryFn: () => pagina.obter(endereco), refetchInterval: 60_000 });

  useEffect(() => {
    if (consulta.data) document.title = `Encomendas · ${consulta.data.nome}`;
  }, [consulta.data]);

  if (consulta.isPending) {
    return (
      <Pagina>
        <div className="pt-6" />
        <Carregando linhas={3} />
      </Pagina>
    );
  }
  if (consulta.isError) {
    return (
      <Pagina>
        <div className="pt-6" />
        {codigoDoErro(consulta.error) === "nao-encontrado" ? (
          <Vazio>Não encontramos esta loja. Confira o endereço com o estabelecimento.</Vazio>
        ) : (
          <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />
        )}
      </Pagina>
    );
  }

  const loja = consulta.data;
  return (
    <>
      <EstiloDaMarca cor={loja.corPrincipal} />
      <Pagina>
        <CabecalhoDaLoja loja={loja} />
        {loja.aviso && (
          <Aviso tom="info" icone="mensagem">
            {loja.aviso}
          </Aviso>
        )}
        {!loja.aceitandoPedidos ? (
          <Aviso tom="alerta" titulo="Pedidos pelo site estão fechados">
            No momento esta loja não está recebendo encomendas por aqui. Fale direto com o estabelecimento.
          </Aviso>
        ) : loja.dias.length === 0 ? (
          <Vazio>Nenhum dia aberto para encomendas agora. Volte mais tarde.</Vazio>
        ) : (
          <Encomenda loja={loja} endereco={endereco} />
        )}
      </Pagina>
    </>
  );
}

function CabecalhoDaLoja({ loja }: { loja: Loja }) {
  return (
    <header className="flex flex-col gap-1 pt-6">
      <p className="m-0 text-rotulo tracking-[.06em] text-brasa uppercase">Encomendas</p>
      <h1 className="m-0 flex items-center gap-3 font-display text-display">
        {/* Endereço livre do estabelecimento: <img> simples, sem otimização do Next. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {loja.logoUrl && <img src={loja.logoUrl} alt="" className="size-10 rounded-sm object-contain" />}
        <span>{loja.nome}</span>
      </h1>
      <p className="m-0 text-ink-muted">Reserve pelo celular e retire no balcão. O pagamento é na retirada.</p>
    </header>
  );
}

type Etapa = "produtos" | "dados";

function Encomenda({ loja, endereco }: { loja: Loja; endereco: string }) {
  const router = useRouter();
  const online = useConexao();
  const queryClient = useQueryClient();
  const { loja: pagina } = useCasosDeUso();

  const [diaId, setDiaId] = useState(loja.dias[0].id);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [etapa, setEtapa] = useState<Etapa>("produtos");
  // Só monta no navegador (depois de a loja chegar), então já dá para ler o que ficou guardado.
  const [nome, setNome] = useState(() => lerCliente().nome);
  const [telefone, setTelefone] = useState(() => lerCliente().telefone);
  const [isca, setIsca] = useState("");
  const [espera, setEspera] = useState<ProdutoDaLoja | null>(null);
  const [naEspera, setNaEspera] = useState<Record<string, true>>({});

  // O dia escolhido pode sumir (prazo acabou enquanto a página estava aberta): volta para o primeiro.
  const dia: DiaDaLoja = loja.dias.find((d) => d.id === diaId) ?? loja.dias[0];
  const itens = dia.produtos.map((p) => ({ produto: p, quantidade: quantidades[p.produtoId] ?? 0 })).filter((i) => i.quantidade > 0);
  const total = somar(...itens.map((i) => multiplicar(i.produto.preco, i.quantidade)));
  const unidades = itens.reduce((t, i) => t + i.quantidade, 0);

  const reservar = useMutation({
    mutationFn: (substituir?: Record<string, number>) => {
      const finais = { ...quantidades, ...substituir };
      return pagina.reservar(endereco, {
        diaId: dia.id,
        cliente: { nome, telefone },
        itens: dia.produtos.map((p) => ({ produtoId: p.produtoId, quantidade: finais[p.produtoId] ?? 0 })),
        site: isca,
      });
    },
    onSuccess: ({ codigo }) => {
      lembrarCliente(nome.trim(), telefone);
      router.push(`/pedido/${codigo}?novo=1`);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: chaves.loja(endereco) }),
  });
  const excesso = reservar.error instanceof QuantidadeIndisponivel ? reservar.error : null;
  const erroDe = (...codigos: string[]) => (codigos.includes(codigoDoErro(reservar.error) ?? "") ? mensagemDeErro(reservar.error) : undefined);

  function escolherDia(id: string) {
    setDiaId(id);
    setQuantidades({});
    reservar.reset();
  }

  function mudar(produtoId: string, quantidade: number) {
    setQuantidades((atual) => ({ ...atual, [produtoId]: quantidade }));
    reservar.reset();
  }

  function confirmar(e: FormEvent) {
    e.preventDefault();
    reservar.mutate(undefined);
  }

  function reservarMaximo() {
    if (!excesso) return;
    const substituir = { [excesso.produtoId]: excesso.maximo };
    setQuantidades((atual) => ({ ...atual, ...substituir }));
    reservar.mutate(substituir);
  }

  return (
    <>
      {loja.dias.length > 1 && (
        <Secao titulo="Para quando?">
          <Filtros<string>
            rotulo="Dia da retirada"
            ativo={dia.id}
            aoMudar={escolherDia}
            opcoes={loja.dias.map((d) => ({ id: d.id, rotulo: dataCurta(d.data) }))}
          />
        </Secao>
      )}

      <Cartao className="flex flex-col gap-1">
        <span className="text-rotulo text-ink-muted">Retirada</span>
        <span className="font-display text-titulo">{dataCurta(dia.data)}</span>
        {loja.enderecoRetirada && <span className="text-ink-muted">{loja.enderecoRetirada}</span>}
        <span className="text-legenda text-ink-muted">Pedidos e cancelamentos até {prazo(dia.encerraEm)}.</span>
      </Cartao>

      {etapa === "produtos" ? (
        <Secao titulo="Produtos">
          {dia.produtos.length === 0 ? (
            <Vazio>Nenhum produto à venda neste dia.</Vazio>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {dia.produtos.map((p) => (
                <li key={p.produtoId}>
                  <CartaoDoProduto
                    produto={p}
                    maximo={loja.maximoPorProduto}
                    quantidade={quantidades[p.produtoId] ?? 0}
                    naEspera={!!naEspera[p.produtoId]}
                    aoMudar={(q) => mudar(p.produtoId, q)}
                    aoPedirAviso={() => setEspera(p)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Secao>
      ) : (
        <form id="dados-do-cliente" onSubmit={confirmar} className="flex flex-col gap-6">
          <Secao titulo="Quem vai retirar?">
            <Campo
              rotulo="Nome"
              autoComplete="name"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                reservar.reset();
              }}
              erro={erroDe("cliente-sem-nome")}
            />
            <Campo
              rotulo="WhatsApp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(44) 99999-9999"
              value={telefone}
              onChange={(e) => {
                setTelefone(e.target.value);
                reservar.reset();
              }}
              dica="A loja usa para confirmar e avisar sobre o pedido."
              erro={erroDe("telefone-invalido", "muitos-pedidos")}
            />
            {/* Isca para robôs: fora da tela e fora do Tab; quem usa a página nunca preenche. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Site
                <input tabIndex={-1} autoComplete="off" value={isca} onChange={(e) => setIsca(e.target.value)} name="site" />
              </label>
            </div>
          </Secao>
          <Resumo itens={itens} total={total} />
          <Botao variante="fantasma" bloco onClick={() => setEtapa("produtos")}>
            Voltar aos produtos
          </Botao>
        </form>
      )}

      {excesso && (
        <Aviso
          tom="critico"
          titulo={excesso.maximo === 0 ? `${excesso.nome} esgotou` : "Quantidade indisponível"}
          acoes={
            <>
              {excesso.maximo > 0 && (
                <Botao tamanho="md" onClick={reservarMaximo} disabled={reservar.isPending}>
                  Reservar {excesso.maximo}
                </Botao>
              )}
              <Botao
                variante="secundario"
                tamanho="md"
                onClick={() => {
                  setEtapa("produtos");
                  reservar.reset();
                }}
              >
                Mudar o pedido
              </Botao>
            </>
          }
        >
          {excesso.maximo === 0
            ? `Alguém reservou as últimas unidades de ${excesso.nome.toLowerCase()} agora há pouco.`
            : `Agora só ${excesso.maximo === 1 ? "resta" : "restam"} ${quantidadeDe(excesso.maximo, excesso.nome.toLowerCase())}.`}
        </Aviso>
      )}
      {reservar.isError && !excesso && !erroDe("cliente-sem-nome", "telefone-invalido", "muitos-pedidos") && (
        <Aviso tom="critico">{mensagemDeErro(reservar.error)}</Aviso>
      )}

      {/* Total e ação principal presos embaixo, ao alcance do polegar. */}
      <div className="sticky bottom-[max(16px,env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface-raised p-3 shadow-flutuante">
        <div className="flex min-w-24 flex-col">
          <span className="text-legenda text-ink-muted">{unidades === 0 ? "Nenhum item" : unidades === 1 ? "1 item" : `${unidades} itens`}</span>
          <span className="font-display text-titulo whitespace-nowrap tabular-nums">{dinheiro(total)}</span>
        </div>
        {/* Chaves diferentes: sem elas o React reaproveita o botão, que vira "submit" no meio do toque e já envia o pedido. */}
        {etapa === "produtos" ? (
          <Botao key="continuar" className="grow" disabled={unidades === 0} onClick={() => setEtapa("dados")}>
            Continuar
          </Botao>
        ) : (
          <Botao
            key="confirmar"
            type="submit"
            form="dados-do-cliente"
            icone="check"
            className="grow"
            disabled={!online || reservar.isPending || unidades === 0}
          >
            {reservar.isPending ? "Reservando…" : "Confirmar reserva"}
          </Botao>
        )}
        {!online && <p className="m-0 w-full text-center text-legenda text-critico">Sem conexão: não dá para reservar agora.</p>}
      </div>

      <FolhaDeEspera
        endereco={endereco}
        dia={dia}
        produto={espera}
        maximo={loja.maximoPorProduto}
        nome={nome}
        telefone={telefone}
        aoMudarNome={setNome}
        aoMudarTelefone={setTelefone}
        aoFechar={() => setEspera(null)}
        aoEntrar={(produtoId) => {
          lembrarCliente(nome.trim(), telefone);
          setNaEspera((atual) => ({ ...atual, [produtoId]: true }));
          setEspera(null);
        }}
      />
    </>
  );
}

function CartaoDoProduto({
  produto,
  maximo,
  quantidade,
  naEspera,
  aoMudar,
  aoPedirAviso,
}: {
  produto: ProdutoDaLoja;
  maximo: number;
  quantidade: number;
  naEspera: boolean;
  aoMudar: (n: number) => void;
  aoPedirAviso: () => void;
}) {
  const esgotado = produto.disponiveis === 0;
  const limite = Math.min(produto.disponiveis, maximo);
  return (
    <Cartao className={esgotado ? "flex flex-col gap-3 border-critico" : "flex flex-col gap-3"}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-corpo-lg font-semibold">{produto.nome}</span>
          <span className="text-ink-muted tabular-nums">{dinheiro(produto.preco)}</span>
        </div>
        {esgotado ? (
          <Status estado="esgotado" />
        ) : (
          <Status estado="disponivel">{produto.disponiveis === 1 ? "1 disponível" : `${produto.disponiveis} disponíveis`}</Status>
        )}
      </div>
      {esgotado ? (
        naEspera ? (
          <p className="m-0 flex items-center gap-2 rounded-md bg-info-soft px-4 py-3 text-info">
            <Icone nome="espera" tamanho={20} />
            Você está na lista de espera. Se sobrar, a loja avisa pelo WhatsApp.
          </p>
        ) : (
          <Botao variante="secundario" bloco icone="espera" onClick={aoPedirAviso}>
            Me avise se sobrar
          </Botao>
        )
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-legenda text-ink-muted">{maximo < produto.disponiveis ? `Até ${maximo} por pedido` : ""}</span>
          <Quantidade
            rotulo={produto.nome}
            valor={quantidade}
            max={limite}
            aoMudar={aoMudar}
            avisoNoLimite={maximo < produto.disponiveis ? `Cada pedido leva até ${maximo}.` : undefined}
          />
        </div>
      )}
    </Cartao>
  );
}

function Resumo({ itens, total }: { itens: readonly { produto: ProdutoDaLoja; quantidade: number }[]; total: Dinheiro }) {
  return (
    <Cartao className="flex flex-col gap-3">
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {itens.map(({ produto, quantidade }) => (
          <li key={produto.produtoId} className="flex justify-between gap-3 text-corpo-lg">
            <span>{quantidadeDe(quantidade, produto.nome)}</span>
            <span className="tabular-nums">{dinheiro(multiplicar(produto.preco, quantidade))}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-ink-muted">Pagamento na retirada</span>
        <span className="font-display text-numero-lg whitespace-nowrap tabular-nums">{dinheiro(total)}</span>
      </div>
    </Cartao>
  );
}

function FolhaDeEspera({
  endereco,
  dia,
  produto,
  maximo,
  nome,
  telefone,
  aoMudarNome,
  aoMudarTelefone,
  aoFechar,
  aoEntrar,
}: {
  endereco: string;
  dia: DiaDaLoja;
  produto: ProdutoDaLoja | null;
  maximo: number;
  nome: string;
  telefone: string;
  aoMudarNome: (nome: string) => void;
  aoMudarTelefone: (telefone: string) => void;
  aoFechar: () => void;
  aoEntrar: (produtoId: string) => void;
}) {
  const { loja: pagina } = useCasosDeUso();
  const [quantidade, setQuantidade] = useState(1);
  const entrar = useMutation({
    mutationFn: () => pagina.entrarNaEspera(endereco, { diaId: dia.id, produtoId: produto!.produtoId, cliente: { nome, telefone }, quantidade }),
    onSuccess: () => aoEntrar(produto!.produtoId),
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    entrar.mutate();
  }

  return (
    <Folha
      titulo={produto ? `Avisar se sobrar ${produto.nome.toLowerCase()}` : ""}
      aberta={!!produto}
      aoFechar={() => {
        entrar.reset();
        aoFechar();
      }}
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <p className="m-0 text-ink-muted">Se alguém cancelar, a loja chama quem está na lista, por ordem de chegada.</p>
        <Campo rotulo="Nome" autoComplete="name" value={nome} onChange={(e) => aoMudarNome(e.target.value)} />
        <Campo rotulo="WhatsApp" type="tel" inputMode="tel" autoComplete="tel" placeholder="(44) 99999-9999" value={telefone} onChange={(e) => aoMudarTelefone(e.target.value)} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-rotulo">Quantas unidades?</span>
          <Quantidade rotulo="Unidades na espera" valor={quantidade} min={1} max={maximo} aoMudar={setQuantidade} />
        </div>
        {entrar.isError && <Aviso tom="critico">{mensagemDeErro(entrar.error)}</Aviso>}
        <Botao type="submit" bloco icone="espera" disabled={entrar.isPending}>
          {entrar.isPending ? "Entrando…" : "Entrar na lista de espera"}
        </Botao>
      </form>
    </Folha>
  );
}
