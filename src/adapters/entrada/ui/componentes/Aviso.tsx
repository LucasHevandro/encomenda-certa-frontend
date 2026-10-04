import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icone, type NomeIcone } from "./Icone";
import { TOM_TEXTO } from "./tons";

export type TomAviso = "critico" | "alerta" | "info" | "ok";

const FUNDO: Record<TomAviso, string> = {
  critico: "bg-critico-soft border-critico",
  alerta: "bg-alerta-soft border-alerta",
  info: "bg-info-soft border-info",
  ok: "bg-ok-soft border-ok",
};

const ICONE_DO_TOM: Record<TomAviso, NomeIcone> = { critico: "alerta", alerta: "alerta", info: "espera", ok: "check" };

/** Mensagem que interrompe ou orienta, sempre com saída: título, número exato e ações. */
export function Aviso({
  tom = "critico",
  titulo,
  icone,
  acoes,
  children,
}: {
  tom?: TomAviso;
  titulo?: string;
  icone?: NomeIcone;
  acoes?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div role={tom === "critico" ? "alert" : "status"} className={cx("flex flex-col gap-4 rounded-md border-[1.5px] p-4", FUNDO[tom])}>
      <div className="flex items-start gap-3">
        <Icone nome={icone ?? ICONE_DO_TOM[tom]} className={TOM_TEXTO[tom]} />
        <div>
          {titulo && <p className="m-0 mb-0.5 text-[17px] font-bold">{titulo}</p>}
          <div className="text-ink">{children}</div>
        </div>
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
