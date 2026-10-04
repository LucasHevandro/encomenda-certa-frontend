import { ImageResponse } from "next/og";
import { Chama } from "./_icone/Chama";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<Chama tamanho={180} />, size);
}
