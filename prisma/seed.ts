import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const categories: {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}[] = [
  // Gastos
  { name: "Alimentação", type: "EXPENSE", color: "#ef4444", icon: "utensils" },
  { name: "Transporte", type: "EXPENSE", color: "#f97316", icon: "car" },
  { name: "Moradia", type: "EXPENSE", color: "#8b5cf6", icon: "home" },
  { name: "Saúde", type: "EXPENSE", color: "#ec4899", icon: "heart-pulse" },
  { name: "Lazer", type: "EXPENSE", color: "#06b6d4", icon: "gamepad-2" },
  { name: "Educação", type: "EXPENSE", color: "#3b82f6", icon: "book-open" },
  { name: "Compras", type: "EXPENSE", color: "#eab308", icon: "shopping-bag" },
  { name: "Contas", type: "EXPENSE", color: "#64748b", icon: "receipt" },
  { name: "Outros", type: "EXPENSE", color: "#94a3b8", icon: "circle-dashed" },
  // Receitas
  { name: "Salário", type: "INCOME", color: "#22c55e", icon: "wallet" },
  { name: "Freelance", type: "INCOME", color: "#14b8a6", icon: "laptop" },
  {
    name: "Investimentos",
    type: "INCOME",
    color: "#10b981",
    icon: "trending-up",
  },
  { name: "Outros", type: "INCOME", color: "#84cc16", icon: "circle-plus" },
];

async function main() {
  console.log("Semeando categorias padrão...");
  for (const category of categories) {
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
