"use client";

import { Icone } from "./Icone";

/** Busca em pílula que filtra enquanto digita. */
export function Busca({
  valor,
  aoMudar,
  placeholder = "Nome, telefone ou nº do pedido",
  rotulo = "Buscar pedido",
}: {
  valor: string;
  aoMudar: (texto: string) => void;
  placeholder?: string;
  rotulo?: string;
}) {
  return (
    <label className="flex min-h-14 items-center gap-2 rounded-full border-[1.5px] border-line-strong bg-surface-raised px-4 text-ink-muted focus-within:shadow-[var(--focus-ring)]">
      <Icone nome="busca" />
      <input
        type="search"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        className="min-w-0 flex-1 border-0 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-muted focus-visible:shadow-none"
      />
    </label>
  );
}
