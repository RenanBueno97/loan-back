# Controle de Gastos

Aplicativo web pessoal (single-user) para controle de gastos e receitas, com
categorias, dashboard com gráficos e orçamentos por categoria.

> Status: **planejamento**. Nenhum código de aplicação ainda — veja o plano
> completo em [`PLAN.md`](./PLAN.md).

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
