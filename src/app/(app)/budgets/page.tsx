"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import { formatBRL, toCents, toReais } from "@/lib/money";
import { currentMonthYear } from "@/lib/date";
import type { BudgetProgress, Category } from "@/lib/types";
import MonthPicker from "@/components/MonthPicker";

interface Row {
  category: Category;
  budget: BudgetProgress | null;
}

export default function BudgetsPage() {
  const [{ month, year }, setPeriod] = useState(currentMonthYear());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [cats, budgets] = await Promise.all([
      apiGet<Category[]>("/api/categories?type=EXPENSE"),
      apiGet<BudgetProgress[]>(`/api/budgets?month=${month}&year=${year}`),
    ]);
    const byCategory = new Map(budgets.map((b) => [b.categoryId, b]));
    setRows(cats.map((category) => ({ category, budget: byCategory.get(category.id) ?? null })));
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(categoryId: string, value: string) {
    const cents = toCents(value);
    if (!cents || cents <= 0) return;
    await apiSend("/api/budgets", "PUT", { categoryId, month, year, limitCents: cents });
    load();
  }

  async function remove(id: string) {
    await apiSend(`/api/budgets?id=${id}`, "DELETE");
    load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => setPeriod({ month: m, year: y })}
        />
      </div>

      <p className="text-sm text-slate-500">
        Defina um limite de gasto por categoria para o mês selecionado.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : (
        <div className="space-y-2">
          {rows.map(({ category, budget }) => (
            <BudgetRow
              key={category.id}
              category={category}
              budget={budget}
              onSave={(v) => save(category.id, v)}
              onRemove={budget ? () => remove(budget.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetRow({
  category,
  budget,
  onSave,
  onRemove,
}: {
  category: Category;
  budget: BudgetProgress | null;
  onSave: (value: string) => void;
  onRemove?: () => void;
}) {
  const [value, setValue] = useState(budget ? String(toReais(budget.limitCents)) : "");

  useEffect(() => {
    setValue(budget ? String(toReais(budget.limitCents)) : "");
  }, [budget]);

  const spent = budget?.spentCents ?? 0;
  const limit = budget?.limitCents ?? 0;
  const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const over = limit > 0 && spent > limit;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
          {category.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => value && onSave(value)}
            placeholder="0,00"
            className="w-28 rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-right text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:focus:border-slate-300"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-slate-400 hover:text-red-600"
              aria-label="Remover orçamento"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {budget && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-500">Gasto: {formatBRL(spent)}</span>
            <span className={over ? "font-medium text-red-600" : "text-slate-500"}>
              {pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : category.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
