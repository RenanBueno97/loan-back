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
import { apiGet } from "@/lib/api";
import { formatBRL } from "@/lib/money";
import { currentMonthYear } from "@/lib/date";
import type { Summary } from "@/lib/types";
import MonthPicker from "@/components/MonthPicker";

export default function DashboardPage() {
  const [{ month, year }, setPeriod] = useState(currentMonthYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setSummary(
      await apiGet<Summary>(`/api/summary?month=${month}&year=${year}`),
    );
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => setPeriod({ month: m, year: y })}
        />
      </div>

      {loading || !summary ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Receitas" value={summary.totalIncome} tone="green" />
            <StatCard label="Gastos" value={summary.totalExpense} tone="red" />
            <StatCard label="Saldo" value={summary.balance} tone="neutral" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Gastos por categoria">
              {summary.byCategory.length === 0 ? (
                <Empty />
              ) : (
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={summary.byCategory}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {summary.byCategory.map((c) => (
                          <Cell key={c.categoryId} fill={c.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatBRL(v)}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="w-full space-y-1 text-sm">
                    {summary.byCategory.slice(0, 6).map((c) => (
                      <li key={c.categoryId} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                        <span className="text-slate-500">{formatBRL(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card title="Evolução (6 meses)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.monthly}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    className="capitalize fill-slate-500"
                  />
                  <Tooltip
                    formatter={(v: number) => formatBRL(v)}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "#94a3b820" }}
                  />
                  <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Orçamentos do mês">
            {summary.budgets.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nenhum orçamento definido. Configure em “Orçamentos”.
              </p>
            ) : (
              <ul className="space-y-3">
                {summary.budgets.map((b) => {
                  const pct = b.limitCents
                    ? Math.min(100, Math.round((b.spentCents / b.limitCents) * 100))
                    : 0;
                  const over = b.spentCents > b.limitCents;
                  return (
                    <li key={b.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{b.category}</span>
                        <span className={over ? "text-red-600" : "text-slate-500"}>
                          {formatBRL(b.spentCents)} / {formatBRL(b.limitCents)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: over ? "#ef4444" : b.color,
                          }}
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
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  background: "#fff",
  color: "#0f172a",
};

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red" | "neutral";
}) {
  const color =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
        ? "text-red-600"
        : value < 0
          ? "text-red-600"
          : "text-slate-900 dark:text-slate-100";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{formatBRL(value)}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold uppercase text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-sm text-slate-400">Sem dados no período.</p>;
}
