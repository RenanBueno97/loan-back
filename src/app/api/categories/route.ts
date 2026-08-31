import { NextRequest, NextResponse } from "next/server";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryInput } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const where: Prisma.CategoryWhereInput | undefined =
    type === "EXPENSE" || type === "INCOME"
      ? { type: type as TransactionType }
      : undefined;
  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = categoryInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const created = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome e tipo" },
        { status: 409 },
      );
    }
    throw e;
  }
}
