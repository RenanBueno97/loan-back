import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryUpdate } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = categoryUpdate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const updated = await prisma.category.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome e tipo" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const count = await prisma.transaction.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: há ${count} transação(ões) nesta categoria` },
      { status: 409 },
    );
  }
  try {
    await prisma.budget.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }
}
