import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

/** Cria as categorias padrão (idempotente). Útil no primeiro acesso. */
export async function POST() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }
  const count = await prisma.category.count();
  return NextResponse.json({ ok: true, count });
}
