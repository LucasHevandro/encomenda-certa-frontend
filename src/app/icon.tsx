import { ImageResponse } from "next/og";
import { Chama } from "./_icone/Chama";

/** Ícones do manifesto gerados no build: /icon/192 e /icon/512. */
export function generateImageMetadata() {
  return [192, 512].map((tamanho) => ({ id: String(tamanho), size: { width: tamanho, height: tamanho }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const tamanho = Number(await id);
  return new ImageResponse(<Chama tamanho={tamanho} />, { width: tamanho, height: tamanho });
}
