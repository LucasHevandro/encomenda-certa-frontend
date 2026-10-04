/** Desenho dos ícones do app: a chama da produção em brasa sobre o papel quente. */
export function Chama({ tamanho }: { tamanho: number }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#b5441a" }}>
      <svg width={tamanho * 0.6} height={tamanho * 0.6} viewBox="0 0 24 24" fill="none" stroke="#f6f2eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />
      </svg>
    </div>
  );
}
