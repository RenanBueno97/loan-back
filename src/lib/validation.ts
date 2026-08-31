import { z } from "zod";

const transactionType = z.enum(["EXPENSE", "INCOME"]);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hex #rrggbb");

export const transactionInput = z.object({
  type: transactionType,
  amountCents: z.coerce.number().int().positive("Valor deve ser positivo"),
  description: z.string().trim().min(1, "Descrição obrigatória").max(200),
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  paid: z.coerce.boolean().optional(),
});
export const transactionUpdate = transactionInput.partial();

// Entrada para criação, aceitando parcelamento opcional.
// - installments: número de parcelas (1 = transação única).
// - splitTotal: se true, o valor informado é o TOTAL e será dividido entre as
//   parcelas; se false/ausente, o valor é o de CADA parcela.
export const transactionCreateInput = transactionInput.extend({
  installments: z.coerce.number().int().min(1).max(360).optional().default(1),
  splitTotal: z.coerce.boolean().optional().default(false),
});

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

export const cashBoxInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(3000),
  amountCents: z.coerce.number().int(),
});

export type TransactionInput = z.infer<typeof transactionInput>;
export type CategoryInput = z.infer<typeof categoryInput>;
export type BudgetInput = z.infer<typeof budgetInput>;
