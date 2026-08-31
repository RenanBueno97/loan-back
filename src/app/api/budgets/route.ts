import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetInput } from "@/lib/validation";

/** Lista orçamentos de um mês/ano, com o valor já gasto em cada categoria. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const month = Number(sp.get("month")) || now.getMonth() + 1;
  const year = Number(sp.get("year")) || now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const spentByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amountCents: true },
  });
  const spentMap = new Map(
    spentByCategory.map((s) => [s.categoryId, s._sum.amountCents ?? 0]),
  );

  const result = budgets.map((b) => ({
    id: b.id,
    categoryId: b.categoryId,
    category: b.category.name,
    color: b.category.color,
    month: b.month,
    year: b.year,
    limitCents: b.limitCents,
    spentCents: spentMap.get(b.categoryId) ?? 0,
  }));
  return NextResponse.json(result);
}

/** Cria ou atualiza (upsert) o orçamento de uma categoria no mês. */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = budgetInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { categoryId, month, year, limitCents } = parsed.data;
  const budget = await prisma.budget.upsert({
    where: { categoryId_month_year: { categoryId, month, year } },
    update: { limitCents },
    create: { categoryId, month, year, limitCents },
  });
  return NextResponse.json(budget);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  try {
    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }
}
