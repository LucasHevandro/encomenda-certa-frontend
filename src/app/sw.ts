/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * O app é só online: o service worker guarda a casca (JS, CSS, fontes, ícones) para abrir rápido
 * e instalar na tela do celular, mas nunca responde dados da API com cache, para não mostrar
 * disponibilidade velha. Sem internet, a navegação cai na página /offline.
 */
const urlApi = process.env.NEXT_PUBLIC_API_URL;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...(urlApi ? [{ matcher: ({ url }: { url: URL }) => (urlApi.startsWith("/") ? url.pathname.startsWith(urlApi + "/") : url.href.startsWith(urlApi)), handler: new NetworkOnly() }] : []),
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
