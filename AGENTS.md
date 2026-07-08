# AGENTS.md — projeto_rdo

RDO (Relatório Diário de Obra) — Sistema web em português para gestão de obras e relatórios diários de construção.

## Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **Tailwind CSS v4**, **TypeScript 5.9**
- **PostgreSQL** via **Drizzle ORM 0.45** (`drizzle-orm/node-postgres` + `pg`)
- **docx** (geração de Word), uploads para `public/uploads/`

## Comandos

```sh
npm run dev       # next dev
npm run build     # next build
npm run lint      # eslint .
npm run typecheck # tsc --noEmit
```

Run `lint` then `typecheck` before committing — `next build` also typechecks but is slower.

## Ambiente

- `DATABASE_URL` é exigida em runtime (a aplicação quebra se ausente).
- `drizzle.config.ts` lê `DATABASE_URL` da variável de ambiente — usada pelo drizzle-kit (migrations).
- Não há `.env.example` — criar `.env.local` com `DATABASE_URL` para desenvolvimento.
- Pool do Postgres é cacheado em `globalThis` para sobreviver a hot-reloads.

## Migrations / Schema

- Schema: `src/db/schema.ts` — 9 tabelas (obras, rdos, mao_de_obra, equipamentos, atividades, ocorrencias, comentarios, anexos, materiais).
- Chaves estrangeiras com `onDelete: "cascade"`.
- Tipos exportados: `Obra`, `NewObra`, `Rdo`, `MaoDeObra`, `Equipamento`, `Atividade`, `Ocorrencia`, `Comentario`.

## Arquitetura

- `src/app/` — App Router com páginas (server components) + API routes (route.ts).
- `src/app/api/` — endpoints REST. PUT em `/api/rdos/[id]` faz delete+re-insert dos filhos (substituição completa).
- `@/*` aponta para `./src/*` (tsconfig paths).
- Upload de imagens: `/api/upload` (JPEG/PNG/WEBP, max 8MB). Upload de documentos: `/api/upload-doc` (qualquer tipo, max 25MB).
- Export Word: rota `/api/rdos/[id]/export-docx`, usa `showSaveFilePicker` com fallback para download direto.
- Labels/constantes em `src/lib/labels.ts` (STATUS_OBRA, STATUS_RDO, CLIMA, CONDICAO, etc).
- `"use client"` necessário em componentes interativos (formulários, botões de export).

## Convenções

- Datas no formato ISO (`YYYY-MM-DD`) no banco; `formatDate()` exibe como `DD/MM/YYYY`.
- Status de obra: `em_andamento`, `paralisada`, `concluida`, `planejamento`.
- Status de RDO: `rascunho`, `finalizado`.
- Clima por período (manha/tarde/noite): `bom`, `nublado`, `chuvoso`, `impraticavel`.
- Condição: `praticavel`, `impraticavel`.
- `force-dynamic` em server components que consultam o banco.
- Número do RDO é auto-incremental por obra (calculado no POST).

## Docker

- `docker-compose.yml` sobe PostgreSQL + app com hot-reload.
- `Dockerfile` produz build standalone para produção.
- `next.config.ts` ativa `output: "standalone"` quando `NODE_ENV=production`.

```sh
docker compose up -d          # dev com hot-reload
docker compose run app npx drizzle-kit push --force  # criar tabelas
```

- Para produção: descomentar `command: ["node", "server.js"]` e comentar o command de dev no `docker-compose.yml`.

## Ausente

- Sem testes, sem CI/CD, sem `.gitignore`.
- Sem documentação adicional — este arquivo é a única referência.
