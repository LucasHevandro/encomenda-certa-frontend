# Encomenda Certa — frontend

Encomendas e produção, num lugar só, para vários estabelecimentos. Next.js 16 (App Router), React 19, Tailwind 4, TanStack Query e Vitest, em arquitetura hexagonal.

## Rodar

```bash
pnpm install
pnpm dev
```

Abra http://localhost:3000 e entre com qualquer e-mail e senha. Sem `NEXT_PUBLIC_API_URL`, o app usa os **adaptadores em memória** com dados de exemplo; recarregar a página volta aos dados iniciais.

```bash
pnpm test      # Vitest: domínio, casos de uso, adaptadores e componentes
pnpm test:e2e  # Playwright: fluxos do balcão no celular e no computador (usa o Chrome instalado)
pnpm build     # build de produção, com o service worker (PWA)
```

## Ligar na API

Copie `.env.example` para `.env.local` (`NEXT_PUBLIC_API_URL=/api` e `API_INTERNA` com o endereço da API). O navegador chama `/api/...` no próprio endereço do app e o Next repassa para a API, então o cookie de sessão funciona em qualquer aparelho, inclusive no celular pela rede (http://IP-do-computador:3000). O `src/config/container.ts` passa a usar os gateways HTTP (`adapters/saida/http`) e o tempo real por SSE (`adapters/saida/tempo-real`). Para ligar uma porta de cada vez, troque só ela no container.

O que o front espera da API:

- Cookie de sessão httpOnly com o nome de `NEXT_PUBLIC_COOKIE_SESSAO`. Com `/api` ele fica no endereço do app e o `src/proxy.ts` enxerga sem configurar domínio.
- Erros como `{ codigo, mensagem, ...detalhes }`. O 409 `quantidade-indisponivel` traz `produtoId`, `nome`, `solicitado` e `maximo`, que vira o botão "Reservar N".
- Dinheiro sempre em centavos (inteiro).
- `GET /dias/:id/eventos` (SSE) com os eventos `disponibilidade-mudou` e `unidades-liberadas` (`{ produtoId, quantidade }`).

As rotas estão em `src/adapters/saida/http/GatewaysHttp.ts`, uma classe por porta, e usam os tipos gerados do contrato da API (`schema.d.ts`). Depois de mudar a API, rode `pnpm openapi` no backend e `pnpm api:tipos` aqui: o TypeScript aponta o que deixou de bater.

## Publicar

O app vai na Vercel e a API no Railway. Na Vercel, defina `NEXT_PUBLIC_API_URL=/api` e `API_INTERNA` com o endereço do Railway antes do deploy. O passo a passo completo está no [PUBLICAR.md do backend](https://github.com/LucasHevandro/expresso-cafe-backend/blob/master/PUBLICAR.md).

## Estrutura

```
src/
├── app/                      # rotas do Next: só renderizam uma tela
│   ├── (publico)/entrar      # login
│   ├── (app)/dias/[diaId]/…  # tudo de um dia: início, pedidos, produção, espera, fechamento
│   ├── (app)/(gestao)/…      # dias de venda, novo dia, produtos, clientes
│   ├── manifest.ts · icon.tsx · sw.ts · serwist/   # PWA
│   └── offline/
├── core/                     # regras e casos de uso, sem React, Next ou fetch
│   ├── domain/
│   └── application/{portas,casos-de-uso}/
├── adapters/
│   ├── entrada/ui/           # componentes do design system, telas e hooks (TanStack Query)
│   └── saida/                # memoria, http, tempo-real (SSE), whatsapp (wa.me)
├── config/                   # container (escolhe os adaptadores) e ProvedorDependencias
└── proxy.ts                  # sem cookie de sessão → /entrar
```

As dependências só apontam para dentro: `app` → `adapters/entrada/ui` → `core`; `adapters/saida` → `core/application/portas`. O ESLint impede o `core` de importar React, Next ou adaptadores.

O app é só online: sem internet, aparece "Sem conexão" e reservar e alterar ficam travados. O service worker guarda só a casca do app, nunca dados da API.
