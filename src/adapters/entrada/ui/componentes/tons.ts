/** Par texto/fundo de cada tom de estado. */
export type Tom = "ok" | "alerta" | "critico" | "info" | "neutro";

export const TOM_SELO: Record<Tom, string> = {
  ok: "bg-ok-soft text-ok",
  alerta: "bg-alerta-soft text-alerta",
  critico: "bg-critico-soft text-critico",
  info: "bg-info-soft text-info",
  neutro: "bg-neutro-soft text-neutro",
};

export const TOM_TEXTO: Record<Tom, string> = {
  ok: "text-ok",
  alerta: "text-alerta",
  critico: "text-critico",
  info: "text-info",
  neutro: "text-neutro",
};

export const TOM_PREENCHIMENTO: Record<Tom, string> = {
  ok: "bg-ok",
  alerta: "bg-alerta",
  critico: "bg-critico",
  info: "bg-info",
  neutro: "bg-neutro",
};
