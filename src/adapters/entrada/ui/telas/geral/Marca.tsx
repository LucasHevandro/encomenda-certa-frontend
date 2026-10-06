"use client";

import { useEffect } from "react";
import { CONFIGURACAO_PADRAO } from "@/core/domain/configuracao/Configuracao";
import { useConfiguracao } from "../../hooks/consultas";

/** Luminância relativa (WCAG) de uma cor #rrggbb. */
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Texto sobre a cor: branco ou quase preto, o que tiver mais contraste. */
export function textoSobre(hex: string): string {
  const l = luminancia(hex);
  return (1.05 / (l + 0.05)) >= ((l + 0.05) / (0.0098 + 0.05)) ? "#ffffff" : "#1f1812";
}

/**
 * Aplica a cor e o nome do estabelecimento. Com a cor padrão nada muda (vale o tokens.css).
 * No tema escuro a cor é clareada para continuar legível sobre o fundo escuro.
 */
export function AplicarMarca() {
  const { corPrincipal, nomeEstabelecimento } = useConfiguracao();

  useEffect(() => {
    if (nomeEstabelecimento && !document.title.includes(nomeEstabelecimento)) {
      document.title = nomeEstabelecimento;
    }
  }, [nomeEstabelecimento]);

  if (corPrincipal === CONFIGURACAO_PADRAO.corPrincipal) return null;
  const claro = `
    --brasa: ${corPrincipal};
    --brasa-hover: color-mix(in oklab, ${corPrincipal} 82%, black);
    --brasa-soft: color-mix(in oklab, ${corPrincipal} 14%, white);
    --on-brasa: ${textoSobre(corPrincipal)};
    --focus: ${corPrincipal};
    --focus-ring: 0 0 0 2px var(--surface), 0 0 0 4px ${corPrincipal};`;
  const escuro = `
    --brasa: color-mix(in oklab, ${corPrincipal} 60%, white);
    --brasa-hover: color-mix(in oklab, ${corPrincipal} 45%, white);
    --brasa-soft: color-mix(in oklab, ${corPrincipal} 28%, #17130f);
    --on-brasa: #1a120c;
    --focus: color-mix(in oklab, ${corPrincipal} 60%, white);
    --focus-ring: 0 0 0 2px var(--surface), 0 0 0 4px color-mix(in oklab, ${corPrincipal} 60%, white);`;
  return (
    <style>{`
      :root { ${claro} }
      @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${escuro} } }
      :root[data-theme="dark"] { ${escuro} }
    `}</style>
  );
}

/** Logo (se houver) e nome do estabelecimento, para o login e a navegação. */
export function NomeDoEstabelecimento({ className }: { className?: string }) {
  const { nomeEstabelecimento, logoUrl } = useConfiguracao();
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {/* Endereço livre do estabelecimento: <img> simples, sem otimização do Next. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logoUrl && <img src={logoUrl} alt="" className="size-8 rounded-sm object-contain" />}
      <span>{nomeEstabelecimento}</span>
    </span>
  );
}
