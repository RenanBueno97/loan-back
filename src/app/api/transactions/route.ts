import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { transactionCreateInput } from "@/lib/validation";
import { splitCents } from "@/lib/money";
import { addMonths } from "@/lib/date";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where: Prisma.TransactionWhereInput = {};

  const month = Number(sp.get("month"));
  const year = Number(sp.get("year"));
  if (month >= 1 && month <= 12 && year > 0) {
    where.date = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  }

  const type = sp.get("type");
  if (type === "EXPENSE" || type === "INCOME") where.type = type;

  const categoryId = sp.get("categoryId");
  if (categoryId) where.categoryId = categoryId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = transactionCreateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { installments, splitTotal, ...base } = parsed.data;

  // Transação única (sem parcelamento).
  if (installments <= 1) {
    const created = await prisma.transaction.create({
      data: base,
      include: { category: true },
    });
    return NextResponse.json(created, { status: 201 });
  }

  // Despesa parcelada: gera uma transação por mês, ligadas pelo mesmo grupo.
  const groupId = randomUUID();
  const perParcel = splitTotal
    ? splitCents(base.amountCents, installments)
    : Array.from({ length: installments }, () => base.amountCents);

  const rows = perParcel.map((amountCents, i) => ({
    ...base,
    amountCents,
    date: addMonths(base.date, i),
    installmentGroupId: groupId,
    installmentNo: i + 1,
    installmentTotal: installments,
  }));

  await prisma.transaction.createMany({ data: rows });
  const first = await prisma.transaction.findFirst({
    where: { installmentGroupId: groupId, installmentNo: 1 },
    include: { category: true },
  });
  return NextResponse.json(first, { status: 201 });
}
