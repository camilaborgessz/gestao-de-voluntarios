# Gestão de Voluntários

Plataforma full-stack (Next.js) para gestão de voluntários, projetos e oportunidades.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Route Handlers como backend)
- TypeScript
- Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Auth.js (NextAuth) v5](https://authjs.dev) com login por credenciais

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha:
   - `DATABASE_URL`: string de conexão do Postgres (Neon, Supabase ou local)
   - `AUTH_SECRET`: gere com `npx auth secret` ou `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

3. Rode as migrações e o seed (cria um usuário admin: `admin@voluntarios.com` / `admin123`):

   ```bash
   npx prisma migrate dev
   ```

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

## Estrutura

- `src/app` — rotas (páginas e API/Route Handlers)
- `src/auth.ts` / `src/auth.config.ts` — configuração do Auth.js
- `src/lib/prisma.ts` — client Prisma (singleton)
- `prisma/schema.prisma` — modelos: `User`, `Project`, `Opportunity`, `Enrollment`
- `prisma/seed.ts` — dados iniciais
