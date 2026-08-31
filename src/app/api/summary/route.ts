import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const month = Number(sp.get("month")) || now.getMonth() + 1;
  const year = Number(sp.get("year")) || now.getFullYear();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // Transações do mês corrente.
  const monthTx = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    include: { category: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategoryMap = new Map<
    string,
    { categoryId: string; name: string; color: string; total: number }
  >();

  for (const t of monthTx) {
    if (t.type === "INCOME") {
      totalIncome += t.amountCents;
    } else {
      totalExpense += t.amountCents;
      const cur = byCategoryMap.get(t.categoryId) ?? {
        categoryId: t.categoryId,
        name: t.category.name,
        color: t.category.color,
        total: 0,
      };
      cur.total += t.amountCents;
      byCategoryMap.set(t.categoryId, cur);
    }
  }
  const byCategory = [...byCategoryMap.values()].sort((a, b) => b.total - a.total);

  // Evolução dos últimos 6 meses (incluindo o mês corrente).
  const sixStart = new Date(year, month - 6, 1);
  const rangeTx = await prisma.transaction.findMany({
    where: { date: { gte: sixStart, lt: end } },
    select: { type: true, amountCents: true, date: true },
  });
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
      income: 0,
      expense: 0,
    };
  });
  const idx = new Map(monthly.map((m, i) => [m.key, i]));
  for (const t of rangeTx) {
    const d = new Date(t.date);
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i === undefined) continue;
    if (t.type === "INCOME") monthly[i].income += t.amountCents;
    else monthly[i].expense += t.amountCents;
  }

  // Progresso dos orçamentos do mês.
  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });
  const budgetProgress = budgets.map((b) => ({
    id: b.id,
    categoryId: b.categoryId,
    category: b.category.name,
    color: b.category.color,
    limitCents: b.limitCents,
    spentCents: byCategoryMap.get(b.categoryId)?.total ?? 0,
  }));

  return NextResponse.json({
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory,
    monthly: monthly.map(({ label, income, expense }) => ({ label, income, expense })),
    budgets: budgetProgress,
  });
}
