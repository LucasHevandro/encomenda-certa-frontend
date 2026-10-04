"use client";

import { useContext } from "react";
import { ContextoDependencias } from "@/config/ProvedorDependencias";

export function useDependencias() {
  const container = useContext(ContextoDependencias);
  if (!container) throw new Error("useCasosDeUso precisa estar dentro de <ProvedorDependencias>.");
  return container;
}

export function useCasosDeUso() {
  return useDependencias().casos;
}
