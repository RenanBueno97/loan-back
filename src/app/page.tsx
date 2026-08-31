export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Controle de Gastos</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Fundação do projeto pronta. As telas serão construídas nas próximas
          fases.
        </p>
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Next.js + TypeScript +
          Tailwind
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Prisma + PostgreSQL
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Seed de categorias padrão
        </li>
        <li className="flex items-center gap-2">
          <span className="text-slate-400">•</span> Próximo: login + CRUD de
          transações
        </li>
      </ul>
    </main>
  );
}
