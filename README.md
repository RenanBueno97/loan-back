# Controle de Gastos

Aplicativo web pessoal (single-user) para controle de gastos e receitas, com
categorias, dashboard com gráficos e orçamentos por categoria.

> Status: **MVP completo** (Fases 0–4). Login, transações, categorias,
> dashboard com gráficos e orçamentos implementados. Veja o roadmap em
> [`PLAN.md`](./PLAN.md).
>
> Nota: a UI usa Tailwind CSS "na mão" (sem shadcn/ui) para manter o projeto
> leve e sem dependências extras.

## Como rodar localmente

Pré-requisitos: Node.js 20+, Docker (para o Postgres).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env   # e ajuste APP_PASSWORD e AUTH_SECRET

# 3. Subir o banco PostgreSQL
docker compose up -d

# 4. Criar as tabelas e semear categorias padrão
npm run db:migrate     # cria a primeira migração
npm run db:seed        # popula categorias padrão

# 5. Rodar o app em desenvolvimento
npm run dev            # http://localhost:3000
```

Scripts úteis: `npm run build`, `npm run db:studio` (Prisma Studio),
`npm run db:push` (sincroniza schema sem migração).

## Visão geral rápida

- **Stack:** Next.js (App Router, React + TypeScript) full-stack, com API via
  Route Handlers.
- **Banco de dados:** PostgreSQL + Prisma ORM.
- **Uso:** pessoal, um único usuário, protegido por uma senha simples.
- **Deploy alvo:** Vercel (app) + Neon/Supabase (Postgres gerenciado), ou
  Docker Compose local.

## Funcionalidades do MVP

1. Registro de gastos e receitas (CRUD de transações).
2. Categorias personalizáveis.
3. Dashboard com totais mensais e gráficos.
4. Orçamentos/metas por categoria e mês.

Consulte o [`PLAN.md`](./PLAN.md) para o detalhamento completo, modelo de
dados, rotas e roadmap.
