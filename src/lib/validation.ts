import { z } from "zod";

const transactionType = z.enum(["EXPENSE", "INCOME"]);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hex #rrggbb");

export const transactionInput = z.object({
  type: transactionType,
  amountCents: z.coerce.number().int().positive("Valor deve ser positivo"),
  description: z.string().trim().min(1, "Descrição obrigatória").max(200),
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Categoria obrigatória"),
});
export const transactionUpdate = transactionInput.partial();

export const categoryInput = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(50),
  type: transactionType,
  color: hexColor,
  icon: z.string().max(50).optional().nullable(),
});
export const categoryUpdate = categoryInput.partial();

export const budgetInput = z.object({
  categoryId: z.string().min(1),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(3000),
  limitCents: z.coerce.number().int().positive(),
});

export type TransactionInput = z.infer<typeof transactionInput>;
export type CategoryInput = z.infer<typeof categoryInput>;
export type BudgetInput = z.infer<typeof budgetInput>;
