"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import { formatBRL, splitCents, toCents, toReais } from "@/lib/money";
import { addMonths, currentMonthYear, formatDate, monthLabel, toDateInput } from "@/lib/date";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import Modal from "@/components/Modal";
import MonthPicker from "@/components/MonthPicker";
import Icon from "@/components/Icon";
import { Button, Field, inputClass } from "@/components/ui";

export default function TransactionsPage() {
  const [{ month, year }, setPeriod] = useState(currentMonthYear());
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [paidFilter, setPaidFilter] = useState<"" | "open" | "paid">("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (typeFilter) params.set("type", typeFilter);
    const [tx, cats] = await Promise.all([
      apiGet<Transaction[]>(`/api/transactions?${params}`),
      apiGet<Category[]>("/api/categories"),
    ]);
    setTransactions(tx);
    setCategories(cats);
    setLoading(false);
  }, [month, year, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(t: Transaction) {
    if (t.installmentGroupId && t.installmentTotal && t.installmentTotal > 1) {
      const all = confirm(
        `Esta é a parcela ${t.installmentNo}/${t.installmentTotal}.\n\n` +
          "OK = excluir TODAS as parcelas deste parcelamento.\n" +
          "Cancelar = manter (excluir só esta, na próxima pergunta).",
      );
      if (all) {
        await apiSend(`/api/transactions/${t.id}?scope=group`, "DELETE");
        load();
        return;
      }
      if (!confirm("Excluir apenas esta parcela?")) return;
      await apiSend(`/api/transactions/${t.id}`, "DELETE");
      load();
      return;
    }
    if (!confirm("Excluir esta transação?")) return;
    await apiSend(`/api/transactions/${t.id}`, "DELETE");
    load();
  }

  async function togglePaid(t: Transaction) {
    // Atualização otimista para resposta imediata.
    setTransactions((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, paid: !x.paid } : x)),
    );
    try {
      await apiSend(`/api/transactions/${t.id}`, "PATCH", { paid: !t.paid });
    } catch {
      load();
    }
  }

  const filters: { value: "" | TransactionType; label: string }[] = [
    { value: "", label: "Tudo" },
    { value: "EXPENSE", label: "Gastos" },
    { value: "INCOME", label: "Receitas" },
  ];
  const paidFilters: { value: "" | "open" | "paid"; label: string }[] = [
    { value: "", label: "Todas" },
    { value: "open", label: "Em aberto" },
    { value: "paid", label: "Pagas" },
  ];

  const shown = transactions.filter((t) =>
    paidFilter === "" ? true : paidFilter === "paid" ? t.paid : !t.paid,
  );
  const openTotal = transactions
    .filter((t) => !t.paid)
    .reduce((s, t) => s + (t.type === "INCOME" ? -t.amountCents : t.amountCents), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Transações</h1>
          <p className="mt-0.5 text-sm text-muted">Tudo que entrou e saiu.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Icon name="plus" size={17} /> Nova
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker month={month} year={year} onChange={(m, y) => setPeriod({ month: m, year: y })} />
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === f.value ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-border bg-surface p-1">
            {paidFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setPaidFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  paidFilter === f.value ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {openTotal !== 0 && (
        <p className="-mt-2 text-sm text-muted">
          Em aberto no mês:{" "}
          <span className="font-semibold text-expense tabular-nums">{formatBRL(openTotal)}</span>
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="space-y-px">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse bg-surface-2" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-faint">
              <Icon name="transactions" size={22} />
            </span>
            <p className="text-sm text-muted">
              {transactions.length === 0
                ? "Nenhuma transação neste período."
                : "Nenhuma transação com esse filtro."}
            </p>
          </div>
        ) : (
          <ul>
            {shown.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-2"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${t.category.color}1f`, color: t.category.color }}
                >
                  <Icon name={t.type === "INCOME" ? "trendUp" : "trendDown"} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span className="truncate">{t.description}</span>
                    {t.installmentTotal && t.installmentTotal > 1 && (
                      <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                        {t.installmentNo}/{t.installmentTotal}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-faint">
                    {formatDate(t.date)} · {t.category.name}
                  </p>
                </div>
                <button
                  onClick={() => togglePaid(t)}
                  title={t.paid ? "Pago — clique para reabrir" : "Em aberto — clique para marcar como pago"}
                  className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    borderColor: t.paid ? "var(--income)" : "var(--border)",
                    color: t.paid ? "var(--income)" : "var(--muted)",
                    background: t.paid ? "color-mix(in srgb, var(--income) 10%, transparent)" : "transparent",
                  }}
                >
                  {t.paid ? "Pago" : "Em aberto"}
                </button>
                <span
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: t.type === "INCOME" ? "var(--income)" : "var(--ink)" }}
                >
                  {t.type === "INCOME" ? "+" : "−"} {formatBRL(t.amountCents)}
                </span>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditing(t);
                      setShowForm(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
                    aria-label="Editar"
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-expense/10 hover:text-expense"
                    aria-label="Excluir"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          transaction={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TransactionForm({
  categories,
  transaction,
  onClose,
  onSaved,
}: {
  categories: Category[];
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(transaction ? String(toReais(transaction.amountCents)) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(
    transaction ? toDateInput(new Date(transaction.date)) : toDateInput(new Date()),
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [paid, setPaid] = useState(transaction?.paid ?? false);
  const [installmentsOn, setInstallmentsOn] = useState(false);
  const [installments, setInstallments] = useState("10");
  const [splitTotal, setSplitTotal] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isNew = !transaction;
  const options = categories.filter((c) => c.type === type);

  // Prévia do parcelamento.
  const nParc = Math.max(1, Math.min(360, parseInt(installments || "1", 10) || 1));
  const totalCents = toCents(amount) || 0;
  const perParcelCents = splitTotal ? splitCents(totalCents, nParc)[0] : totalCents;
  const grandTotalCents = splitTotal ? totalCents : totalCents * nParc;
  const startDate = new Date(`${date}T12:00:00`);
  const lastDate = addMonths(startDate, nParc - 1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cents = toCents(amount);
    if (!cents || cents <= 0) return setError("Informe um valor válido.");
    if (!categoryId) return setError("Selecione uma categoria.");

    setSaving(true);
    const payload: Record<string, unknown> = {
      type,
      amountCents: cents,
      description,
      date: new Date(`${date}T12:00:00`).toISOString(),
      categoryId,
      paid,
    };
    try {
      if (transaction) {
        await apiSend(`/api/transactions/${transaction.id}`, "PATCH", payload);
      } else {
        if (installmentsOn && nParc > 1) {
          payload.installments = nParc;
          payload.splitTotal = splitTotal;
        }
        await apiSend("/api/transactions", "POST", payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={transaction ? "Editar transação" : "Nova transação"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["EXPENSE", "INCOME"] as const).map((t) => {
            const on = type === t;
            const c = t === "EXPENSE" ? "var(--expense)" : "var(--income)";
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategoryId("");
                }}
                className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: on ? c : "var(--border)",
                  color: on ? c : "var(--muted)",
                  background: on ? `color-mix(in srgb, ${c} 8%, transparent)` : "transparent",
                }}
              >
                <Icon name={t === "EXPENSE" ? "trendDown" : "trendUp"} size={16} />
                {t === "EXPENSE" ? "Gasto" : "Receita"}
              </button>
            );
          })}
        </div>

        <Field label={installmentsOn ? "Valor de cada parcela ou total (R$)" : "Valor (R$)"}>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} text-lg font-semibold`}
            placeholder="0,00"
            autoFocus
          />
        </Field>

        <Field label="Descrição">
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Ex.: Mercado" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Selecione…</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={installmentsOn ? "Data da 1ª parcela" : "Data"}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Situação">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: false, label: "Em aberto", color: "var(--muted)" },
              { v: true, label: "Pago", color: "var(--income)" },
            ].map((opt) => {
              const on = paid === opt.v;
              return (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setPaid(opt.v)}
                  className="rounded-xl border py-2.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: on ? opt.color : "var(--border)",
                    color: on ? opt.color : "var(--muted)",
                    background: on ? `color-mix(in srgb, ${opt.color} 8%, transparent)` : "transparent",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
        {installmentsOn && (
          <p className="-mt-1 text-xs text-faint">
            A situação vale para todas as parcelas; depois marque cada mês como pago na lista.
          </p>
        )}

        {isNew && (
          <div className="rounded-xl border border-border bg-surface-2 p-3.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={installmentsOn}
                onChange={(e) => setInstallmentsOn(e.target.checked)}
                className="h-4 w-4 rounded border-border"
                style={{ accentColor: "var(--accent)" }}
              />
              Parcelar em vários meses
            </label>

            {installmentsOn && (
              <div className="mt-3.5 space-y-3">
                <Field label="Número de parcelas (meses)">
                  <input
                    type="number"
                    min="2"
                    max="360"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: false, label: "Valor por mês" },
                    { v: true, label: "Valor total (dividir)" },
                  ].map((opt) => {
                    const on = splitTotal === opt.v;
                    return (
                      <button
                        key={String(opt.v)}
                        type="button"
                        onClick={() => setSplitTotal(opt.v)}
                        className="rounded-xl border py-2 text-xs font-medium transition-colors"
                        style={{
                          borderColor: on ? "var(--accent)" : "var(--border)",
                          color: on ? "var(--accent)" : "var(--muted)",
                          background: on ? "var(--accent-soft)" : "transparent",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {totalCents > 0 && nParc > 1 && (
                  <p className="rounded-lg bg-accent-soft px-3 py-2.5 text-xs leading-relaxed text-ink">
                    <strong>{nParc}x</strong> de <strong>{formatBRL(perParcelCents)}</strong>
                    {splitTotal ? " (aprox.)" : ""} — total <strong>{formatBRL(grandTotalCents)}</strong>.
                    <br />
                    1ª em {monthLabel(startDate.getMonth() + 1, startDate.getFullYear())}, última em{" "}
                    {monthLabel(lastDate.getMonth() + 1, lastDate.getFullYear())}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
