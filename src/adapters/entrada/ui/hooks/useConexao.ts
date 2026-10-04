"use client";

import { useSyncExternalStore } from "react";

function assinar(aoMudar: () => void) {
  window.addEventListener("online", aoMudar);
  window.addEventListener("offline", aoMudar);
  return () => {
    window.removeEventListener("online", aoMudar);
    window.removeEventListener("offline", aoMudar);
  };
}

/** O app é só online: sem conexão, a tela avisa e trava o que muda a disponibilidade. */
export function useConexao(): boolean {
  return useSyncExternalStore(
    assinar,
    () => navigator.onLine,
    () => true,
  );
}
