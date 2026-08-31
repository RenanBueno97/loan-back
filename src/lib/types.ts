export type TransactionType = "EXPENSE" | "INCOME";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  description: string;
  date: string;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  id: string;
  categoryId: string;
  category: string;
  color: string;
  limitCents: number;
  spentCents: number;
}

export interface Summary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { categoryId: string; name: string; color: string; total: number }[];
  monthly: { label: string; income: number; expense: number }[];
  budgets: BudgetProgress[];
}
