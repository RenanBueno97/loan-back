"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { apiGet, apiSend } from "@/lib/api";
import { formatBRL, toCents, toReais } from "@/lib/money";
import { currentMonthYear } from "@/lib/date";
import type { CashBox, Summary } from "@/lib/types";
import MonthPicker from "@/components/MonthPicker";
import Icon, { type IconName } from "@/components/Icon";
import { Card, CardTitle } from "@/components/ui";

export default function DashboardPage() {
  const [{ month, year }, setPeriod] = useState(currentMonthYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cashCents, setCashCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, cb] = await Promise.all([
      apiGet<Summary>(`/api/summary?month=${month}&year=${year}`),
      apiGet<CashBox>(`/api/cashbox?month=${month}&year=${year}`),
    ]);
    setSummary(s);
    setCashCents(cb.amountCents);
    setLoading(false);
  }, [month, year]);

  async function saveCash(value: string) {
    const cents = toCents(value);
    if (Number.isNaN(cents)) return;
    await apiSend("/api/cashbox", "PUT", { month, year, amountCents: cents });
    setCashCents(cents);
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Um panorama do seu mês.
          </p>
        </div>
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => setPeriod({ month: m, year: y })}
        />
      </header>

      {loading || !summary ? (
        <Skeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Receitas" value={summary.totalIncome} icon="trendUp" tone="income" />
            <StatCard label="Gastos" value={summary.totalExpense} icon="trendDown" tone="expense" />
            <StatCard label="Saldo" value={summary.balance} icon="scale" tone="balance" />
            <CashBoxCard cents={cashCents} onSave={saveCash} />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardTitle>Gastos por categoria</CardTitle>
              {summary.byCategory.length === 0 ? (
                <Empty />
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="relative h-[168px] w-[168px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.byCategory}
                          dataKey="total"
                          nameKey="name"
                          innerRadius={54}
                          outerRadius={80}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {summary.byCategory.map((c) => (
                            <Cell key={c.categoryId} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wide text-faint">
                        Total
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        {formatBRL(summary.totalExpense)}
                      </span>
                    </div>
                  </div>
                  <ul className="w-full space-y-2 text-sm">
                    {summary.byCategory.slice(0, 5).map((c) => (
                      <li key={c.categoryId} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 text-ink">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted">{formatBRL(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card className="lg:col-span-3">
              <CardTitle>Receitas x Gastos · 6 meses</CardTitle>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={summary.monthly} barGap={4}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickMargin={8}
                    className="capitalize"
                    stroke="var(--faint)"
                  />
                  <Tooltip
                    formatter={(v: number) => formatBRL(v)}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--accent-soft)" }}
                  />
                  <Bar dataKey="income" name="Receitas" fill="var(--income)" radius={[5, 5, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="expense" name="Gastos" fill="var(--expense)" radius={[5, 5, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <CardTitle>Orçamentos do mês</CardTitle>
            {summary.budgets.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum orçamento definido ainda. Crie um em{" "}
                <span className="font-medium text-ink">Orçamentos</span>.
              </p>
            ) : (
              <ul className="space-y-4">
                {summary.budgets.map((b) => {
                  const pct = b.limitCents
                    ? Math.min(100, Math.round((b.spentCents / b.limitCents) * 100))
                    : 0;
                  const over = b.spentCents > b.limitCents;
                  return (
                    <li key={b.id}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-ink">{b.category}</span>
                        <span className={`tabular-nums ${over ? "font-medium text-expense" : "text-muted"}`}>
                          {formatBRL(b.spentCents)}{" "}
                          <span className="text-faint">/ {formatBRL(b.limitCents)}</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: over ? "var(--expense)" : b.color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 12,
  boxShadow: "0 8px 24px -12px rgba(0,0,0,0.25)",
};

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: IconName;
  tone: "income" | "expense" | "balance";
}) {
  const color =
    tone === "income"
      ? "var(--income)"
      : tone === "expense"
        ? "var(--expense)"
        : value < 0
          ? "var(--expense)"
          : "var(--ink)";
  return (
    <Card className="flex items-center gap-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--accent-soft)", color }}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tabular-nums" style={{ color }}>
          {formatBRL(value)}
        </p>
      </div>
    </Card>
  );
}

function CashBoxCard({
  cents,
  onSave,
}: {
  cents: number;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setValue(cents ? String(toReais(cents)) : "");
  }, [cents]);

  return (
    <Card className="flex items-center gap-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Icon name="wallet" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-faint">Caixinha</p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-sm text-faint">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            placeholder="0,00"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            onFocus={() => setEditing(true)}
            onBlur={() => {
              setEditing(false);
              if (value !== (cents ? String(toReais(cents)) : "")) onSave(value);
            }}
            className="w-full min-w-0 bg-transparent text-xl font-semibold tabular-nums text-ink outline-none placeholder:text-faint"
          />
        </div>
      </div>
      {editing && <span className="shrink-0 text-[10px] text-faint">Enter/sair p/ salvar</span>}
    </Card>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-faint">Sem dados no período.</p>;
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface-2" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface-2 lg:col-span-2" />
        <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface-2 lg:col-span-3" />
      </div>
    </div>
  );
}
