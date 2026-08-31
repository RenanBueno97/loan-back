# Controle de Gastos

Aplicativo web pessoal (single-user) para controle de gastos e receitas, com
categorias, dashboard com gráficos e orçamentos por categoria.

> Status: **MVP completo** (Fases 0–4). Login, transações, categorias,
> dashboard com gráficos e orçamentos implementados. Veja o roadmap em
> [`PLAN.md`](./PLAN.md).
>
> **Design:** identidade própria (marca "Grana"), paleta verde-petróleo +
> terracota, ícones SVG desenhados à mão, fonte Inter, tema claro/escuro e
> componentes de UI próprios sobre Tailwind CSS v4 — sem bibliotecas de UI
> externas.

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

Scripts úteis: `npm run build:app` (build sem migração), `npm run db:studio`
(Prisma Studio), `npm run db:push` (sincroniza schema sem migração).

## Deploy (Vercel + Neon)

O projeto já está pronto para deploy: o `npm run build` roda
`prisma migrate deploy` automaticamente, criando as tabelas no primeiro
publish. Passo a passo (uns ~5 min, tudo em planos gratuitos):

### 1. Banco de dados gratuito (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech) e um projeto Postgres.
2. Copie a **connection string** (formato
   `postgresql://user:pass@host/db?sslmode=require`).

> Alternativas: Supabase, Vercel Postgres ou Railway — qualquer Postgres serve.

### 2. Deploy na Vercel

1. Suba este repositório para o GitHub (já está) e, na
   [vercel.com](https://vercel.com), clique em **Add New → Project** e importe
   o repositório `loan-back`.
2. Em **Production Branch**, selecione a branch com o código
   (`claude/expense-tracking-app-plan-e21e5i`) — ou faça o merge para `main`
   antes e use `main`.
3. Em **Environment Variables**, defina:

   | Variável        | Valor                                                      |
   | --------------- | ---------------------------------------------------------- |
   | `DATABASE_URL`  | a connection string do Neon                                |
   | `APP_PASSWORD`  | a senha que você usará para entrar no app                   |
   | `AUTH_SECRET`   | um segredo longo e aleatório (ex.: `openssl rand -base64 32`) |

4. Clique em **Deploy**. No build, as tabelas são criadas automaticamente.

### 3. Primeiro acesso

1. Abra a URL gerada e entre com a `APP_PASSWORD`.
2. Vá em **Categorias → Criar categorias padrão** (ou rode `npm run db:seed`
   localmente apontando para o mesmo banco).
3. Comece a registrar transações. 🎉

> Dica de segurança: use uma `APP_PASSWORD` forte — é o único obstáculo entre
> a internet e seus dados.

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
