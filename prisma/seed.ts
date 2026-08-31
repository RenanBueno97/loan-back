import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/defaultCategories";

const prisma = new PrismaClient();

async function main() {
  console.log("Semeando categorias padrão...");
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }
  const count = await prisma.category.count();
  console.log(`Pronto. ${count} categorias no banco.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
