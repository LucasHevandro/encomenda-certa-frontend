"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useId, useState } from "react";
import {
  CAMPOS_DA_MENSAGEM,
  CONFIGURACAO_PADRAO,
  type Configuracao,
  ENCERRAMENTOS_ONLINE,
  type FormaDePagamento,
  FORMAS_DE_PAGAMENTO,
  NOMES_DOS_DIAS,
  type PedidosOnline as PedidosOnlineDaLoja,
  preencherMensagem,
  sugerirEndereco,
} from "@/core/domain/configuracao/Configuracao";
import { Aviso, Botao, Campo, Cartao, Carregando, classesBotao, FalhaAoCarregar, Icone, Pagina, Quantidade, Secao } from "../../componentes";
import { cx } from "../../componentes/cx";
import { codigoDoErro, mensagemDeErro } from "../../erros";
import { useSalvarConfiguracao } from "../../hooks/acoes";
import { chaves } from "../../hooks/chaves";
import { useCasosDeUso } from "../../hooks/useCasosDeUso";
import { useConexao } from "../../hooks/useConexao";

const ROTULO_PAGAMENTO: Record<FormaDePagamento, string> = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };
// Semana começando na segunda, como no calendário do balcão.
const ORDEM_DOS_DIAS = [1, 2, 3, 4, 5, 6, 0];
const COR_VALIDA = /^#[0-9a-f]{6}$/i;

/** O que muda de um estabelecimento para outro: marca, dias de venda, pagamentos e a mensagem do WhatsApp. */
export function TelaConfiguracoes() {
  const { configuracao } = useCasosDeUso();
  const atual = useQuery({ queryKey: chaves.configuracao(), queryFn: () => configuracao.obter(), staleTime: 5 * 60_000 });

  return (
    <Pagina>
      <header className="pt-6">
        <h1 className="m-0 font-display text-display">Configurações</h1>
        <p className="m-0 mt-1 text-ink-muted">Vale para todo mundo que usa o app neste estabelecimento.</p>
      </header>
      {atual.isPending ? (
        <Carregando linhas={4} />
      ) : atual.isError ? (
        <FalhaAoCarregar erro={atual.error} aoTentarDeNovo={() => atual.refetch()} />
      ) : (
        <Formulario inicial={atual.data} />
      )}
    </Pagina>
  );
}

function Formulario({ inicial }: { inicial: Configuracao }) {
  const online = useConexao();
  const salvar = useSalvarConfiguracao();
  const [rascunho, setRascunho] = useState(inicial);
  const [salva, setSalva] = useState(false);
  const codigo = codigoDoErro(salvar.error);
  const erroDe = (c: string) => (codigo === c ? mensagemDeErro(salvar.error) : undefined);

  function mudar(parcial: Partial<Configuracao>) {
    setRascunho((r) => ({ ...r, ...parcial }));
    setSalva(false);
  }

  function alternar<T>(lista: readonly T[], item: T): T[] {
    return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    setSalva(false);
    salvar.mutate(rascunho, {
      onSuccess: (nova) => {
        setRascunho(nova);
        setSalva(true);
      },
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      <Secao titulo="Marca">
        <Cartao className="flex flex-col gap-3">
          <Campo
            rotulo="Nome do estabelecimento"
            value={rascunho.nomeEstabelecimento}
            onChange={(e) => mudar({ nomeEstabelecimento: e.target.value })}
            erro={erroDe("config-nome")}
          />
          <CampoCor valor={rascunho.corPrincipal} aoMudar={(corPrincipal) => mudar({ corPrincipal })} erro={erroDe("config-cor")} />
          <Campo
            rotulo="Logo (opcional)"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={rascunho.logoUrl ?? ""}
            onChange={(e) => mudar({ logoUrl: e.target.value })}
            dica="Endereço de uma imagem pública, de preferência quadrada."
            erro={erroDe("config-logo")}
          />
        </Cartao>
      </Secao>

      <Secao titulo="Vendas">
        <Cartao className="flex flex-col gap-5">
          <Escolhas
            rotulo="Dias de venda"
            opcoes={ORDEM_DOS_DIAS.map((d) => ({ id: d, rotulo: NOMES_DOS_DIAS[d] }))}
            marcados={rascunho.diasDeVenda}
            aoAlternar={(d) => mudar({ diasDeVenda: alternar(rascunho.diasDeVenda, d) })}
            erro={erroDe("config-dias")}
          />
          <Escolhas
            rotulo="Formas de pagamento aceitas"
            dica="“Pendente” sempre aparece, para quem ainda vai pagar."
            opcoes={FORMAS_DE_PAGAMENTO.map((f) => ({ id: f, rotulo: ROTULO_PAGAMENTO[f] }))}
            marcados={rascunho.formasDePagamento}
            aoAlternar={(f) => mudar({ formasDePagamento: alternar(rascunho.formasDePagamento, f) })}
            erro={erroDe("config-pagamento")}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-rotulo">Avisar “Atenção” com</span>
              <span className="text-legenda text-ink-muted">Produto com essa quantidade ou menos fica em destaque.</span>
            </div>
            <Quantidade rotulo="Limite de atenção" valor={rascunho.limiteAtencao} max={99} aoMudar={(limiteAtencao) => mudar({ limiteAtencao })} />
          </div>
          {codigo === "config-limite" && <Aviso tom="critico">{mensagemDeErro(salvar.error)}</Aviso>}
        </Cartao>
      </Secao>

      <Secao titulo="Pedidos online">
        <PedidosOnline
          valor={rascunho.pedidosOnline}
          salvo={inicial.pedidosOnline}
          nome={rascunho.nomeEstabelecimento}
          aoMudar={(parcial) => mudar({ pedidosOnline: { ...rascunho.pedidosOnline, ...parcial } })}
          erro={erroDe("config-endereco") ?? erroDe("endereco-em-uso")}
          erroMaximo={erroDe("config-maximo")}
        />
      </Secao>

      <Secao titulo="Confirmação pelo WhatsApp">
        <Cartao className="flex flex-col gap-3">
          <Campo
            rotulo="Endereço de retirada (opcional)"
            value={rascunho.enderecoRetirada ?? ""}
            onChange={(e) => mudar({ enderecoRetirada: e.target.value })}
            dica="Entra na mensagem no lugar de {endereco}."
          />
          <AreaMensagem valor={rascunho.mensagemWhatsapp} aoMudar={(mensagemWhatsapp) => mudar({ mensagemWhatsapp })} erro={erroDe("config-mensagem")} />
          <Botao
            type="button"
            variante="fantasma"
            tamanho="md"
            onClick={() => mudar({ mensagemWhatsapp: CONFIGURACAO_PADRAO.mensagemWhatsapp })}
            disabled={rascunho.mensagemWhatsapp === CONFIGURACAO_PADRAO.mensagemWhatsapp}
          >
            Voltar à mensagem padrão
          </Botao>
          <Previa configuracao={rascunho} />
        </Cartao>
      </Secao>

      {salvar.isError && !codigo?.startsWith("config-") && codigo !== "endereco-em-uso" && <Aviso tom="critico">{mensagemDeErro(salvar.error)}</Aviso>}
      {salvar.isError && (codigo?.startsWith("config-") || codigo === "endereco-em-uso") && <Aviso tom="critico">Confira o campo marcado acima.</Aviso>}
      {salva && (
        <Aviso tom="ok" titulo="Configurações salvas">
          Já valem para todos os aparelhos.
        </Aviso>
      )}
      <Botao type="submit" bloco icone="check" disabled={!online || salvar.isPending}>
        {salvar.isPending ? "Salvando…" : "Salvar configurações"}
      </Botao>
    </form>
  );
}

/** Página pública da loja: ligar, endereço, prazo, máximo por produto e aviso. */
function PedidosOnline({
  valor,
  salvo,
  nome,
  aoMudar,
  erro,
  erroMaximo,
}: {
  valor: PedidosOnlineDaLoja;
  /** O que já está valendo: o link só aparece depois de salvo. */
  salvo: PedidosOnlineDaLoja;
  nome: string;
  aoMudar: (parcial: Partial<PedidosOnlineDaLoja>) => void;
  erro?: string;
  erroMaximo?: string;
}) {
  const idPrazo = useId();
  const [copiado, setCopiado] = useState(false);
  // O formulário só aparece depois de a configuração chegar, já no navegador.
  const origem = typeof window === "undefined" ? "" : window.location.origin;
  const sugestao = sugerirEndereco(nome);
  const linkSalvo = salvo.ativo && salvo.endereco ? `${origem}/loja/${salvo.endereco}` : null;

  async function copiar(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Cartao className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-corpo-lg font-semibold">Receber pedidos pela página</span>
          <span className="text-legenda text-ink-muted">Os clientes reservam pelo celular, do mesmo estoque do balcão.</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={valor.ativo}
          aria-label="Receber pedidos pela página"
          onClick={() => aoMudar({ ativo: !valor.ativo, ...(!valor.ativo && !valor.endereco && sugestao.length >= 3 && { endereco: sugestao }) })}
          className={cx(
            "flex h-9 w-15 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors",
            valor.ativo ? "justify-end bg-ok" : "justify-start bg-line-strong",
          )}
        >
          <span className="size-8 rounded-full bg-surface-raised shadow-cartao" />
        </button>
      </div>

      <Campo
        rotulo="Endereço da página"
        value={valor.endereco ?? ""}
        onChange={(e) => aoMudar({ endereco: e.target.value.toLowerCase() })}
        autoCapitalize="none"
        spellCheck={false}
        maxLength={40}
        placeholder={sugestao || "minha-loja"}
        dica={`${origem || ""}/loja/${valor.endereco?.trim() || "…"} · letras minúsculas, números e hífen.`}
        erro={erro}
      />

      {linkSalvo && (
        <div className="flex flex-wrap gap-2">
          <a href={linkSalvo} target="_blank" rel="noopener" className={classesBotao({ variante: "secundario", tamanho: "md" })}>
            <Icone nome="online" tamanho={20} />
            <span>Abrir a página</span>
          </a>
          <Botao variante="secundario" tamanho="md" icone="link" onClick={() => copiar(linkSalvo)}>
            {copiado ? "Link copiado" : "Copiar link"}
          </Botao>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idPrazo} className="text-rotulo">
          Receber pedidos até
        </label>
        <select
          id={idPrazo}
          value={valor.encerramentoMinutos}
          onChange={(e) => aoMudar({ encerramentoMinutos: Number(e.target.value) })}
          className="min-h-14 w-full rounded-md border-[1.5px] border-line-strong bg-surface-raised px-3 text-[17px] text-ink"
        >
          {ENCERRAMENTOS_ONLINE.map((e) => (
            <option key={e.minutos} value={e.minutos}>
              {e.rotulo}
            </option>
          ))}
        </select>
        <p className="m-0 text-legenda text-ink-muted">Conta a partir do dia de venda. O cliente também só cancela pela página até aqui.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-rotulo">Máximo de cada produto por pedido</span>
          <span className="text-legenda text-ink-muted">Evita que um pedido leve tudo.</span>
        </div>
        <Quantidade rotulo="Máximo por produto" valor={valor.maximoPorProduto} min={1} max={99} aoMudar={(maximoPorProduto) => aoMudar({ maximoPorProduto })} />
      </div>
      {erroMaximo && <Aviso tom="critico">{erroMaximo}</Aviso>}

      <Campo
        rotulo="Aviso no topo da página (opcional)"
        value={valor.aviso ?? ""}
        onChange={(e) => aoMudar({ aviso: e.target.value })}
        maxLength={200}
        placeholder="Ex.: Retirada pela porta lateral."
      />
    </Cartao>
  );
}

function CampoCor({ valor, aoMudar, erro }: { valor: string; aoMudar: (cor: string) => void; erro?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-rotulo">
        Cor principal
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label="Escolher a cor"
          value={COR_VALIDA.test(valor) ? valor.toLowerCase() : "#000000"}
          onChange={(e) => aoMudar(e.target.value)}
          className="size-14 shrink-0 cursor-pointer rounded-md border-[1.5px] border-line-strong bg-surface-raised p-1"
        />
        <input
          id={id}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          maxLength={7}
          spellCheck={false}
          aria-invalid={!!erro}
          className={cx(
            "min-h-14 w-full rounded-md border-[1.5px] bg-surface-raised px-4 font-mono text-[17px] text-ink",
            erro ? "border-critico" : "border-line-strong",
          )}
        />
      </div>
      <p className={cx("m-0 text-legenda", erro ? "font-semibold text-critico" : "text-ink-muted")}>
        {erro ?? "Botões e destaques. O texto sobre ela fica claro ou escuro sozinho."}
      </p>
    </div>
  );
}

/** Chips de múltipla escolha: cada um liga e desliga sozinho. */
function Escolhas<T extends string | number>({
  rotulo,
  dica,
  opcoes,
  marcados,
  aoAlternar,
  erro,
}: {
  rotulo: string;
  dica?: string;
  opcoes: readonly { id: T; rotulo: string }[];
  marcados: readonly T[];
  aoAlternar: (id: T) => void;
  erro?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-rotulo">
        {rotulo}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const marcado = marcados.includes(opcao.id);
          return (
            <button
              key={opcao.id}
              type="button"
              aria-pressed={marcado}
              onClick={() => aoAlternar(opcao.id)}
              className={cx(
                "inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[15px] font-semibold whitespace-nowrap",
                marcado ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface-raised text-ink",
              )}
            >
              {marcado && <Icone nome="check" tamanho={16} />}
              {opcao.rotulo}
            </button>
          );
        })}
      </div>
      {(erro || dica) && <p className={cx("m-0 text-legenda", erro ? "font-semibold text-critico" : "text-ink-muted")}>{erro ?? dica}</p>}
    </div>
  );
}

function AreaMensagem({ valor, aoMudar, erro }: { valor: string; aoMudar: (texto: string) => void; erro?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-rotulo">
        Mensagem
      </label>
      <textarea
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        rows={10}
        maxLength={1000}
        aria-invalid={!!erro}
        className={cx(
          "w-full rounded-md border-[1.5px] bg-surface-raised px-4 py-3 text-[16px] leading-snug text-ink",
          erro ? "border-critico" : "border-line-strong",
        )}
      />
      <p className={cx("m-0 text-legenda", erro ? "font-semibold text-critico" : "text-ink-muted")}>
        {erro ?? `Campos: ${CAMPOS_DA_MENSAGEM.map((c) => `{${c}}`).join(" ")}. Linha com campo vazio some.`}
      </p>
    </div>
  );
}

/** Como a mensagem chega para um pedido de exemplo. */
function Previa({ configuracao }: { configuracao: Configuracao }) {
  const texto = preencherMensagem(configuracao.mensagemWhatsapp, {
    cliente: "Maria",
    numero: "#0042",
    itens: "• 2x Frango assado — R$ 110,00\n• 1x Maionese — R$ 12,00",
    total: "R$ 122,00",
    data: "domingo, 18/10",
    estabelecimento: configuracao.nomeEstabelecimento.trim() || "Seu estabelecimento",
    endereco: configuracao.enderecoRetirada?.trim() || undefined,
  });
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-rotulo">Prévia</span>
      <p aria-label="Prévia da mensagem" className="m-0 rounded-md bg-ok-soft px-4 py-3 text-[15px] leading-snug whitespace-pre-wrap text-ink">
        {texto}
      </p>
    </div>
  );
}
