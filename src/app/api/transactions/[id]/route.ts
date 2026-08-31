import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionUpdate } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = transactionUpdate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const scope = req.nextUrl.searchParams.get("scope");
  try {
    // scope=group exclui todas as parcelas do mesmo parcelamento.
    if (scope === "group") {
      const tx = await prisma.transaction.findUnique({ where: { id } });
      if (tx?.installmentGroupId) {
        const { count } = await prisma.transaction.deleteMany({
          where: { installmentGroupId: tx.installmentGroupId },
        });
        return NextResponse.json({ ok: true, deleted: count });
      }
    }
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: 1 });
  } catch {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }
}
