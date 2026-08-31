# Plano — App Web de Controle de Gastos

Documento de planejamento do aplicativo. Objetivo: um app pessoal simples,
rápido e agradável de usar para acompanhar gastos, receitas e orçamentos.

---

## 1. Escopo e princípios

- **Single-user:** um único dono. Sem cadastro público; acesso protegido por
  uma senha (definida em variável de ambiente) que gera uma sessão via cookie
  JWT. Isso evita deixar os dados abertos na internet sem exigir gestão de
  múltiplas contas.
- **Simplicidade primeiro:** um único projeto Next.js (frontend + API juntos),
  fácil de rodar e hospedar.
- **Dados são sagrados:** toda transação tem data, valor, tipo e categoria.
  Nada de exclusão em massa sem confirmação.
- **Moeda:** BRL (R$) por padrão, formatação `pt-BR`. Valores armazenados em
  centavos (inteiro) para evitar erros de ponto flutuante.

## 2. Stack técnica

| Camada        | Escolha                                   |
| ------------- | ----------------------------------------- |
| Framework     | Next.js 15 (App Router) + TypeScript      |
| UI            | React 19 + Tailwind CSS + shadcn/ui       |
| Gráficos      | Recharts                                  |
| Banco         | PostgreSQL                                |
| ORM           | Prisma                                     |
| Auth          | Senha única → cookie JWT (jose)           |
| Validação     | Zod                                        |
| Testes        | Vitest (unit) + Playwright (e2e)          |
| Deploy        | Vercel + Neon/Supabase, ou Docker local   |

**Por que Next.js full-stack?** Um único repositório e deploy, API e UI no
mesmo lugar, ótimo para um app pessoal. Prisma dá migrações versionadas e
type-safety ponta a ponta.

## 3. Modelo de dados

```
Category
  id          String   @id @default(cuid())
  name        String
  type        Enum(EXPENSE | INCOME)   // categoria de gasto ou receita
  color       String   // hex, para gráficos
  icon        String?  // nome de ícone (opcional)
  createdAt   DateTime @default(now())
  transactions Transaction[]
  budgets      Budget[]

Transaction
  id          String   @id @default(cuid())
  type        Enum(EXPENSE | INCOME)
  amountCents Int      // sempre positivo; o "type" define o sinal
  description String
  date        DateTime // data do gasto/receita
  categoryId  String
  category    Category @relation(...)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

Budget                 // orçamento mensal por categoria
  id          String   @id @default(cuid())
  categoryId  String
  category    Category @relation(...)
  month       Int      // 1-12
  year        Int
  limitCents  Int
  @@unique([categoryId, month, year])
```

Índices em `Transaction(date)` e `Transaction(categoryId)` para as consultas
do dashboard.

## 4. Rotas da API (Route Handlers)

Todas sob `/api`, protegidas por middleware de sessão (exceto `login`).

| Método | Rota                     | Descrição                                  |
| ------ | ------------------------ | ------------------------------------------ |
| POST   | `/api/login`             | Recebe senha, devolve cookie de sessão     |
| POST   | `/api/logout`            | Encerra a sessão                           |
| GET    | `/api/transactions`      | Lista com filtros (mês, categoria, tipo)   |
| POST   | `/api/transactions`      | Cria transação                             |
| PATCH  | `/api/transactions/:id`  | Edita transação                            |
| DELETE | `/api/transactions/:id`  | Remove transação                           |
| GET    | `/api/categories`        | Lista categorias                           |
| POST   | `/api/categories`        | Cria categoria                             |
| PATCH  | `/api/categories/:id`    | Edita categoria                            |
| DELETE | `/api/categories/:id`    | Remove (bloqueia se houver transações)     |
| GET    | `/api/budgets`           | Lista orçamentos do mês                    |
| PUT    | `/api/budgets`           | Define/atualiza orçamento (upsert)         |
| GET    | `/api/summary`           | Agregados do dashboard (por mês/categoria) |

Toda entrada validada com Zod; respostas JSON padronizadas com tratamento de
erro.

## 5. Telas (UI)

1. **Login** — campo de senha único.
2. **Dashboard** (`/`) — cartões de saldo/receitas/gastos do mês, gráfico de
   pizza por categoria, gráfico de barras de evolução mensal, e progresso dos
   orçamentos.
3. **Transações** (`/transactions`) — tabela com filtros (mês, tipo,
   categoria), busca, e modal de criar/editar.
4. **Categorias** (`/categories`) — CRUD com cor e ícone.
5. **Orçamentos** (`/budgets`) — definir limite por categoria no mês, com
   barra de progresso (gasto vs. limite).

Layout com navegação lateral, responsivo (mobile-first), tema claro/escuro.

## 6. Estrutura de pastas (proposta)

```
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts              # categorias padrão
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (app)/
│   │   │   ├── page.tsx            # dashboard
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   └── budgets/
│   │   └── api/
│   │       ├── login/ logout/
│   │       ├── transactions/
│   │       ├── categories/
│   │       ├── budgets/
│   │       └── summary/
│   ├── components/          # UI reutilizável (shadcn/ui + custom)
│   ├── lib/                 # prisma client, auth, money, validação (zod)
│   └── middleware.ts        # proteção de sessão
├── docker-compose.yml       # postgres local
├── .env.example
└── package.json
```

## 7. Roadmap de implementação

**Fase 0 — Fundação** ✅
- [x] Inicializar Next.js + TypeScript + Tailwind.
- [x] Configurar Prisma + docker-compose com Postgres; schema inicial.
- [x] Seed com categorias padrão (Alimentação, Transporte, Moradia, Lazer,
      Salário, etc.).

**Fase 1 — Auth + Transações (MVP núcleo)** ✅
- [x] Login por senha + middleware de sessão (JWT em cookie httpOnly).
- [x] CRUD de transações + tela de listagem com filtros (mês/tipo).

**Fase 2 — Categorias** ✅
- [x] CRUD de categorias com cor (bloqueia exclusão com transações).

**Fase 3 — Dashboard** ✅
- [x] Endpoint `/api/summary` + cartões e gráficos (Recharts: pizza + barras).

**Fase 4 — Orçamentos** ✅
- [x] Upsert de orçamentos por categoria/mês + barras de progresso.

**Fase 5 — Polimento** (próximos passos)
- [ ] Tema claro/escuro por toggle (hoje segue o sistema), estados de erro.
- [ ] Testes (Vitest + Playwright).
- [ ] (Opcional) Exportar CSV, transações recorrentes, importação de extrato,
      ícones nas categorias, hash da senha.

> Observação: a Fase 5 (dark mode segue `prefers-color-scheme`; UI em Tailwind
> puro em vez de shadcn/ui para evitar dependências extras).

## 8. Extras futuros (fora do MVP)

- Transações recorrentes (assinaturas, salário).
- Importação de extrato/CSV do banco.
- Exportação de relatórios (CSV/PDF).
- Multi-moeda; tags além de categorias.
- PWA para uso offline no celular.
