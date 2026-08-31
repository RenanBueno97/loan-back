"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import { formatBRL, toCents, toReais } from "@/lib/money";
import { currentMonthYear } from "@/lib/date";
import type { BudgetProgress, Category } from "@/lib/types";
import MonthPicker from "@/components/MonthPicker";
import Icon from "@/components/Icon";

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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Orçamentos</h1>
          <p className="mt-0.5 text-sm text-muted">Defina um limite de gasto por categoria no mês.</p>
        </div>
        <MonthPicker month={month} year={year} onChange={(m, y) => setPeriod({ month: m, year: y })} />
      </header>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
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
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: category.color }} />
          {category.name}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-xl border border-border bg-surface-2 pl-3 focus-within:border-accent">
            <span className="text-sm text-faint">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => value && onSave(value)}
              placeholder="0,00"
              className="w-24 bg-transparent px-2 py-2 text-right text-sm text-ink outline-none"
            />
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-expense/10 hover:text-expense"
              aria-label="Remover orçamento"
            >
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
      </div>

      {budget && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Gasto: <span className="tabular-nums text-ink">{formatBRL(spent)}</span></span>
            <span className={over ? "font-medium text-expense" : "text-muted"}>
              {over ? "Estourou · " : ""}{pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: over ? "var(--expense)" : category.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
