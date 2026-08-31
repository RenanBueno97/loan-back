import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashBoxInput } from "@/lib/validation";

/** Retorna a caixinha de um mês/ano (amountCents = 0 se ainda não preenchida). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const month = Number(sp.get("month")) || now.getMonth() + 1;
  const year = Number(sp.get("year")) || now.getFullYear();

  const cashBox = await prisma.cashBox.findUnique({
    where: { month_year: { month, year } },
  });
  return NextResponse.json({ month, year, amountCents: cashBox?.amountCents ?? 0 });
}

/** Cria ou atualiza (upsert) a caixinha do mês. */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = cashBoxInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { month, year, amountCents } = parsed.data;
  const cashBox = await prisma.cashBox.upsert({
    where: { month_year: { month, year } },
    update: { amountCents },
    create: { month, year, amountCents },
  });
  return NextResponse.json(cashBox);
}
