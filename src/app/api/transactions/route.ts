import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { transactionInput } from "@/lib/validation";

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
  const parsed = transactionInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.transaction.create({
    data: parsed.data,
    include: { category: true },
  });
  return NextResponse.json(created, { status: 201 });
}
