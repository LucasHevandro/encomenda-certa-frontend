/**
 * Tema claro ou escuro, escolhido em cada aparelho (não é configuração da empresa).
 * Sem escolha, segue o sistema. A escolha vira data-theme no <html>, que o tokens.css já entende.
 */
export type Tema = "claro" | "escuro";

const CHAVE = "expresso_tema";
const COR_DA_BARRA: Record<Tema, string> = { claro: "#f6f2eb", escuro: "#17130f" };

/** Roda no <head> antes da primeira pintura, para não piscar o tema errado ao abrir. */
export const SCRIPT_DO_TEMA = `try{var t=localStorage.getItem("${CHAVE}");if(t==="claro"||t==="escuro")document.documentElement.dataset.theme=t==="escuro"?"dark":"light"}catch(e){}`;

function escolhido(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "claro" || valor === "escuro" ? valor : null;
  } catch {
    return null;
  }
}

/** O tema que está na tela agora: o escolhido ou, sem escolha, o do sistema. */
export function temaAtual(): Tema {
  return escolhido() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro");
}

const ouvintes = new Set<() => void>();

export function escolherTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem armazenamento (aba anônima): vale só até fechar.
  }
  document.documentElement.dataset.theme = tema === "escuro" ? "dark" : "light";
  // A barra do navegador e do app instalado acompanha o tema escolhido.
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", COR_DA_BARRA[tema]));
  ouvintes.forEach((ouvinte) => ouvinte());
}

/** Para useSyncExternalStore: muda ao escolher aqui ou quando o sistema troca de tema. */
export function assinarTema(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  const sistema = window.matchMedia("(prefers-color-scheme: dark)");
  sistema.addEventListener("change", aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
    sistema.removeEventListener("change", aoMudar);
  };
}
